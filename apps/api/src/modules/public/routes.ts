import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { createAppointment, getPublicBookingContext, listAvailableSlots } from "../../lib/booking.js";
import { findIdempotency, IdempotencyConflictError, rememberIdempotency } from "../../lib/idempotency.js";
import { sha256 } from "../../lib/crypto.js";
import {
  DEMO_PUBLIC_SLUG,
  createDemoPublicBookingResponse,
  createDemoPublicSlotsResponse,
  demoPublicWorkspaceResponse
} from "./demo.js";
import { MercadoPagoProvider } from "../payments/provider.js";

export const publicRoutes: FastifyPluginAsync = async (app) => {
  app.get("/public/b/:slug", async (req) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    if (env.PUBLIC_DEMO_ENABLED && slug === DEMO_PUBLIC_SLUG) {
      return demoPublicWorkspaceResponse;
    }
    const { workspace, services, staffMembers } = await getPublicBookingContext(slug);

    return {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        timezone: workspace.timezone,
        address: workspace.address,
        whatsapp: workspace.whatsapp,
        contactEmail: workspace.contactEmail,
        logoUrl: workspace.logoUrl,
        about: workspace.about,
        brandPrimary: workspace.brandPrimary,
        brandAccent: workspace.brandAccent,
        bookingPolicy: workspace.bookingPolicy,
        publicBookingEnabled: workspace.publicBookingEnabled
      },
      services,
      staffMembers
    };
  });

  app.get("/public/b/:slug/slots", async (req) => {
    const query = z
      .object({
        serviceId: z.string(),
        staffMemberId: z.string().optional(),
        date: z.string()
      })
      .parse(req.query);
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    if (env.PUBLIC_DEMO_ENABLED && slug === DEMO_PUBLIC_SLUG) {
      return createDemoPublicSlotsResponse(query.date, query.serviceId, query.staffMemberId);
    }
    const workspace = await prisma.workspace.findUniqueOrThrow({ where: { slug } });
    const result = await listAvailableSlots({
      workspaceId: workspace.id,
      serviceId: query.serviceId,
      staffMemberId: query.staffMemberId,
      date: new Date(query.date)
    });

    return {
      staffMemberId: result.staff.id,
      slots: result.slots.map((slot) => slot.toISOString())
    };
  });

  app.post("/public/b/:slug/book", { config: { rateLimit: { max: 25, timeWindow: "1 minute" } } }, async (req) => {
    const body = z
      .object({
        serviceId: z.string(),
        staffMemberId: z.string(),
        startAt: z.string(),
        name: z.string().min(2),
        whatsapp: z.string().min(8),
        email: z.string().email().optional(),
        notesClient: z.string().max(500).optional(),
        whatsappOptIn: z.boolean(),
        policyAccepted: z.literal(true)
      })
      .parse(req.body);
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    if (env.PUBLIC_DEMO_ENABLED && slug === DEMO_PUBLIC_SLUG) {
      const response = createDemoPublicBookingResponse({
        serviceId: body.serviceId,
        startAt: body.startAt
      });
      if (!response) {
        throw app.httpErrors.notFound("Servico demo nao encontrado.");
      }
      return response;
    }
    const workspace = await prisma.workspace.findUniqueOrThrow({ where: { slug } });
    if (!workspace.publicBookingEnabled) {
      throw app.httpErrors.forbidden("Agendamento publico desabilitado para este negocio.");
    }

    const requestFingerprint = sha256(
      JSON.stringify({
        slug,
        serviceId: body.serviceId,
        staffMemberId: body.staffMemberId,
        startAt: body.startAt,
        whatsapp: body.whatsapp
      })
    );
    const idempotencyKey = (req.headers["x-idempotency-key"] as string | undefined) ?? `public:${requestFingerprint}`;
    const remembered = await findIdempotency({
      scope: "public_booking",
      key: idempotencyKey,
      workspaceId: workspace.id
    });

    if (remembered) {
      if (remembered.requestHash && remembered.requestHash !== requestFingerprint) {
        throw app.httpErrors.conflict("Esta chave de idempotencia ja foi usada com outro payload.");
      }

      if (isBookingReplayResponse(remembered.responseBody)) {
        return {
          ...remembered.responseBody,
          duplicated: true
        };
      }
    }

    const existing = await prisma.appointment.findUnique({
      where: { idempotencyKey },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });
    if (existing) {
      return {
        appointmentId: existing.id,
        status: existing.status,
        payment: existing.payments[0] ? serializePayment(existing.payments[0]) : undefined,
        duplicated: true
      };
    }

    const client = await prisma.client.upsert({
      where: {
        workspaceId_whatsapp: {
          workspaceId: workspace.id,
          whatsapp: body.whatsapp,
        }
      },
      update: {
        name: body.name,
        email: body.email ?? null,
        whatsappOptInAt: body.whatsappOptIn ? new Date() : null,
        whatsappOptInIp: req.ip,
        whatsappOptInMethod: "public_form"
      },
      create: {
        workspaceId: workspace.id,
        name: body.name,
        whatsapp: body.whatsapp,
        email: body.email ?? null,
        whatsappOptInAt: body.whatsappOptIn ? new Date() : null,
        whatsappOptInIp: req.ip,
        whatsappOptInMethod: "public_form"
      }
    });

    let created;
    try {
      created = await createAppointment({
        workspaceId: workspace.id,
        serviceId: body.serviceId,
        staffMemberId: body.staffMemberId,
        clientId: client.id,
        startAt: new Date(body.startAt),
        source: "public",
        idempotencyKey,
        notesClient: body.notesClient
      });
    } catch (error) {
      if (error instanceof Error && ["SLOT_NOT_AVAILABLE", "SLOT_CONFLICT"].includes(error.message)) {
        throw app.httpErrors.conflict("Este horario acabou de ficar indisponivel. Escolha outro.");
      }
      if (error instanceof Error && error.message === "OUTSIDE_BOOKING_WINDOW") {
        throw app.httpErrors.badRequest("Horario fora da janela permitida pelo negocio.");
      }
      throw error;
    }

    if (created.status === "pending_payment") {
      const provider = new MercadoPagoProvider();
      const payment = await provider.createPixCharge({
        amount: created.depositAmount ?? 0,
        description: `Sinal ${workspace.name}`,
        payerName: client.name,
        payerEmail: client.email ?? undefined,
        idempotencyKey,
        externalReference: created.appointment.id
      });

      const savedPayment = await prisma.payment.create({
        data: {
          appointmentId: created.appointment.id,
          amount: created.depositAmount ?? 0,
          provider: "mercado_pago",
          status: "pending",
          externalId: payment.externalId,
          idempotencyKey,
          qrCode: payment.qrCode,
          pixCopyPaste: payment.pixCopyPaste,
          expiresAt: payment.expiresAt ?? null,
          providerPayload: payment.rawPayload as never
        }
      });

      const response = {
        appointmentId: created.appointment.id,
        status: created.status,
        payment: serializePayment(savedPayment)
      };

      await persistReplayOrThrow(app, {
        key: idempotencyKey,
        workspaceId: workspace.id,
        requestHash: requestFingerprint,
        response
      });

      return response;
    }

    const response = {
      appointmentId: created.appointment.id,
      status: created.status,
      confirmationCode: randomUUID()
    };

    await persistReplayOrThrow(app, {
      key: idempotencyKey,
      workspaceId: workspace.id,
      requestHash: requestFingerprint,
      response
    });

    return response;
  });
};

async function persistReplayOrThrow(
  app: FastifyInstance,
  input: {
    key: string;
    workspaceId: string;
    requestHash: string;
    response: {
      appointmentId: string;
      status: string;
      confirmationCode?: string;
      payment?: {
        externalId: string | null;
        qrCode: string | null;
        pixCopyPaste: string | null;
        expiresAt: string | null;
      };
    };
  }
) {
  try {
    await rememberIdempotency({
      scope: "public_booking",
      key: input.key,
      workspaceId: input.workspaceId,
      requestHash: input.requestHash,
      responseBody: input.response,
      statusCode: 201
    });
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      throw app.httpErrors.conflict("Esta chave de idempotencia ja foi usada com outro payload.");
    }

    throw error;
  }
}

function isBookingReplayResponse(value: unknown): value is {
  appointmentId: string;
  status: string;
  confirmationCode?: string;
  payment?: {
    externalId: string | null;
    qrCode: string | null;
    pixCopyPaste: string | null;
    expiresAt: string | null;
  };
} {
  return Boolean(value && typeof value === "object" && "appointmentId" in value && "status" in value);
}

function serializePayment(payment: {
  externalId: string | null;
  qrCode: string | null;
  pixCopyPaste: string | null;
  expiresAt: Date | null;
}) {
  return {
    externalId: payment.externalId,
    qrCode: payment.qrCode,
    pixCopyPaste: payment.pixCopyPaste,
    expiresAt: payment.expiresAt?.toISOString() ?? null
  };
}
