import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAudit } from "../../lib/audit.js";
import { requireRole } from "../../lib/permissions.js";
import { prisma } from "../../lib/prisma.js";
import {
  buildCommissionSummary,
  buildFinanceDashboard,
  createCashClosure,
  createManualFinancialEntry,
  ensureFinanceCatalog,
  listFinancialEntries,
  serializeEntry
} from "./service.js";

const directionSchema = z.enum(["inflow", "outflow"]);
const statusSchema = z.enum(["pending", "paid", "cancelled", "overdue"]);
const filterKindSchema = z.enum(["appointment_receivable", "manual_receivable", "manual_expense", "commission", "adjustment", "payout"]);
const createKindSchema = z.enum(["manual_receivable", "manual_expense", "commission", "adjustment", "payout"]);

function escapeCsv(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replace(/"/g, "\"\"")}"`;
  }
  return raw;
}

export const financeRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/finance/dashboard", async (req) => {
    requireRole(app, req, ["staff"]);
    return buildFinanceDashboard(req.workspaceId);
  });

  app.get("/me/finance/entries", async (req) => {
    requireRole(app, req, ["staff"]);

    const query = z
      .object({
        direction: directionSchema.optional(),
        status: statusSchema.optional(),
        kind: filterKindSchema.optional()
      })
      .parse(req.query);

    const catalog = await ensureFinanceCatalog(prisma, req.workspaceId);
    const entries = await listFinancialEntries({
      workspaceId: req.workspaceId,
      direction: query.direction,
      status: query.status,
      kind: query.kind
    });

    return {
      catalog: {
        categories: catalog.categories.map((item: any) => ({
          id: item.id,
          name: item.name,
          direction: item.direction,
          colorHex: item.colorHex
        })),
        costCenters: catalog.costCenters.map((item: any) => ({
          id: item.id,
          name: item.name
        }))
      },
      entries: entries.map(serializeEntry)
    };
  });

  app.get("/me/finance/commissions", async (req) => {
    requireRole(app, req, ["staff"]);

    const query = z
      .object({
        from: z.string().optional(),
        to: z.string().optional()
      })
      .parse(req.query);

    return buildCommissionSummary(
      req.workspaceId,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined
    );
  });

  app.post("/me/finance/entries", async (req) => {
    requireRole(app, req, ["manager"]);

    const body = z
      .object({
        title: z.string().min(2),
        description: z.string().optional(),
        direction: directionSchema,
        kind: createKindSchema,
        amountCents: z.number().int().positive(),
        occurredAt: z.string().datetime().optional(),
        dueDate: z.string().datetime().optional(),
        paidAt: z.string().datetime().optional(),
        categoryId: z.string().optional(),
        costCenterId: z.string().optional(),
        staffMemberId: z.string().optional()
      })
      .parse(req.body);

    const entry = await createManualFinancialEntry(prisma, {
      workspaceId: req.workspaceId,
      createdByUserId: (req.user as any).sub,
      title: body.title,
      description: body.description,
      direction: body.direction,
      kind: body.kind,
      amountCents: body.amountCents,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      paidAt: body.paidAt ? new Date(body.paidAt) : null,
      categoryId: body.categoryId,
      costCenterId: body.costCenterId,
      staffMemberId: body.staffMemberId
    });

    await writeAudit({
      workspaceId: req.workspaceId,
      actorUserId: (req.user as any).sub,
      action: "finance.entry_created",
      entityType: "financial_entry",
      entityId: entry.id,
      payload: {
        title: body.title,
        direction: body.direction,
        kind: body.kind,
        amountCents: body.amountCents
      }
    });

    return { ok: true, entry: serializeEntry(entry) };
  });

  app.patch("/me/finance/entries/:id", async (req) => {
    requireRole(app, req, ["manager"]);

    const params = z.object({ id: z.string() }).parse(req.params);
    const body = z
      .object({
        status: statusSchema,
        paidAt: z.string().datetime().optional(),
        description: z.string().optional()
      })
      .parse(req.body);

    const entry = await (prisma as any).financialEntry.update({
      where: { id: params.id, workspaceId: req.workspaceId },
      data: {
        status: body.status,
        paidAt: body.status === "paid" ? (body.paidAt ? new Date(body.paidAt) : new Date()) : null,
        description: body.description
      }
    });

    await writeAudit({
      workspaceId: req.workspaceId,
      actorUserId: (req.user as any).sub,
      action: "finance.entry_updated",
      entityType: "financial_entry",
      entityId: entry.id,
      payload: body
    });

    return { ok: true, entry: serializeEntry(entry) };
  });

  app.post("/me/finance/cash-closures", async (req) => {
    requireRole(app, req, ["manager"]);

    const body = z
      .object({
        openedAt: z.string().datetime(),
        closedAt: z.string().datetime(),
        actualBalanceCents: z.number().int().optional(),
        notes: z.string().optional()
      })
      .parse(req.body);

    const closure = await createCashClosure({
      workspaceId: req.workspaceId,
      closedByUserId: (req.user as any).sub,
      openedAt: new Date(body.openedAt),
      closedAt: new Date(body.closedAt),
      actualBalanceCents: body.actualBalanceCents,
      notes: body.notes
    });

    await writeAudit({
      workspaceId: req.workspaceId,
      actorUserId: (req.user as any).sub,
      action: "finance.cash_closure_created",
      entityType: "cash_closure",
      entityId: closure.id,
      payload: body
    });

    return { ok: true, closure };
  });

  app.get("/me/finance/export.csv", async (req, reply) => {
    requireRole(app, req, ["receptionist"]);

    const query = z
      .object({
        direction: directionSchema.optional(),
        status: statusSchema.optional(),
        kind: filterKindSchema.optional()
      })
      .parse(req.query);

    const entries = await listFinancialEntries({
      workspaceId: req.workspaceId,
      direction: query.direction,
      status: query.status,
      kind: query.kind
    });

    const csv = [
      "id,data_ocorrencia,titulo,tipo,direcao,status,categoria,centro_custo,profissional,valor_centavos,vencimento,pago_em",
      ...entries.map((entry: any) =>
        [
          escapeCsv(entry.id),
          escapeCsv(entry.occurredAt.toISOString()),
          escapeCsv(entry.title),
          escapeCsv(entry.kind),
          escapeCsv(entry.direction),
          escapeCsv(entry.status),
          escapeCsv(entry.category?.name),
          escapeCsv(entry.costCenter?.name),
          escapeCsv(entry.staffMember?.name),
          escapeCsv(entry.amountCents),
          escapeCsv(entry.dueDate?.toISOString()),
          escapeCsv(entry.paidAt?.toISOString())
        ].join(",")
      )
    ].join("\n");

    reply.header("content-type", "text/csv");
    return csv;
  });
};
