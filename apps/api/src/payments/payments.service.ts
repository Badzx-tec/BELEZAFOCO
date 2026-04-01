import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { MercadoPagoService } from "../integrations/mercadopago/mercadopago.service";
import type { CreatePixPaymentDto } from "./dto/create-pix-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mp: MercadoPagoService
  ) {}

  async createPixPayment(workspaceId: string, dto: CreatePixPaymentDto) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: dto.appointmentId, workspaceId },
      include: {
        service: { select: { name: true, priceCents: true, depositAmountCents: true, depositRequired: true } },
        client: { select: { email: true, fullName: true } }
      }
    });
    if (!appointment) throw new NotFoundException("Appointment not found");
    if (!["pending_payment", "confirmed"].includes(appointment.status)) {
      throw new BadRequestException("Appointment is not awaiting payment");
    }

    const amountCents = appointment.depositRequired
      ? (appointment.depositRequiredAmountCents ?? appointment.service.priceCents)
      : appointment.service.priceCents;

    const idempotencyKey =
      dto.idempotencyKey ?? `${workspaceId}:${dto.appointmentId}:pix`;

    // Return existing payment if idempotency key already used
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
      include: { attempts: { orderBy: { createdAt: "desc" }, take: 1 } }
    });
    if (existing) return existing;

    const payerEmail =
      appointment.client.email ?? `noreply+${appointment.clientId}@belezafoco.dev`;

    const mpResult = await this.mp.createPixPayment({
      idempotencyKey,
      amountCents,
      payerEmail,
      description: `${appointment.service.name} — BELEZAFOCO`
    });

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          workspaceId,
          appointmentId: dto.appointmentId,
          provider: "mercado_pago",
          status: "pending",
          amountCents,
          idempotencyKey,
          externalPaymentId: mpResult.externalPaymentId,
          pixQrCode: mpResult.pixQrCode,
          pixCopyPaste: mpResult.pixCopyPaste,
          expiresAt: mpResult.expiresAt,
          providerMetadata: mpResult.raw as object
        }
      });

      await tx.paymentAttempt.create({
        data: {
          workspaceId,
          paymentId: payment.id,
          provider: "mercado_pago",
          status: "pending",
          idempotencyKey,
          requestPayload: {
            amountCents,
            payerEmail,
            appointmentId: dto.appointmentId
          },
          responsePayload: mpResult.raw as object,
          processedAt: new Date()
        }
      });

      return payment;
    });
  }

  async getPayment(workspaceId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, workspaceId },
      include: { attempts: { orderBy: { createdAt: "desc" }, take: 5 } }
    });
    if (!payment) throw new NotFoundException("Payment not found");
    return payment;
  }

  async reconcilePayment(externalPaymentId: string, mpStatus: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { externalPaymentId }
    });
    if (!payment) return null;

    const internalStatus =
      mpStatus === "approved" ? "paid"
      : mpStatus === "rejected" || mpStatus === "cancelled" ? "failed"
      : payment.status;

    if (internalStatus === payment.status) return payment;

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: internalStatus,
          ...(internalStatus === "paid" ? { paidAt: new Date() } : {}),
          ...(internalStatus === "failed" ? { providerMetadata: { mpStatus } } : {})
        }
      });

      // Transition linked appointment to confirmed when payment is approved
      if (internalStatus === "paid" && payment.appointmentId) {
        const appt = await tx.appointment.findUnique({
          where: { id: payment.appointmentId }
        });
        if (appt?.status === "pending_payment") {
          await tx.appointment.update({
            where: { id: payment.appointmentId },
            data: { status: "confirmed", depositPaidAt: new Date() }
          });
        }
      }

      return p;
    });

    return updated;
  }
}
