import { Prisma } from "@prisma/client";

export const DEMO_PUBLIC_SLUG = "demo-beleza";

export const demoPublicWorkspaceResponse = {
  workspace: {
    id: "demo-workspace",
    name: "Studio Beleza Foco",
    slug: DEMO_PUBLIC_SLUG,
    timezone: "America/Sao_Paulo",
    address: "Rua das Flores, 120 - Centro",
    whatsapp: "+55 11 99999-9999",
    logoUrl: null,
    description:
      "Agenda premium para barbearias, saloes, nails e estetica com booking mobile-first, lembretes no WhatsApp e sinal via Pix.",
    bookingPolicy:
      "Chegue com 5 minutos de antecedencia. Cancelamentos com menos de 24 horas podem gerar taxa conforme a politica do negocio.",
    brandPrimaryColor: "#111827",
    brandAccentColor: "#c48b5a",
    minAdvanceMinutes: 120,
    maxAdvanceDays: 30
  },
  businessHours: [
    { weekday: 1, startTime: "09:00", endTime: "19:00" },
    { weekday: 2, startTime: "09:00", endTime: "19:00" },
    { weekday: 3, startTime: "09:00", endTime: "19:00" },
    { weekday: 4, startTime: "09:00", endTime: "19:00" },
    { weekday: 5, startTime: "09:00", endTime: "19:00" },
    { weekday: 6, startTime: "09:00", endTime: "16:00" }
  ],
  services: [
    {
      id: "service-cut",
      name: "Corte Premium",
      category: "Barbearia",
      description: "Corte com acabamento completo, consultoria rapida e finalizacao premium.",
      durationMinutes: 45,
      prepMinutes: 5,
      finishingMinutes: 10,
      priceType: "fixed",
      priceValue: 5500,
      featured: true,
      depositEnabled: false,
      depositAmount: null
    },
    {
      id: "service-nail",
      name: "Manicure em Gel",
      category: "Nail Design",
      description: "Alongamento, acabamento e brilho duradouro para agenda disputada.",
      durationMinutes: 75,
      prepMinutes: 10,
      finishingMinutes: 10,
      priceType: "starts_at",
      priceValue: 9000,
      featured: true,
      depositEnabled: true,
      depositAmount: 2000
    },
    {
      id: "service-skin",
      name: "Limpeza de Pele Premium",
      category: "Estetica",
      description: "Sessao completa com avaliacao, extracao e mascara calmante.",
      durationMinutes: 90,
      prepMinutes: 10,
      finishingMinutes: 10,
      priceType: "fixed",
      priceValue: 15000,
      featured: false,
      depositEnabled: true,
      depositAmount: 3000
    }
  ],
  staffMembers: [
    {
      id: "staff-joao",
      name: "Joao Silva",
      bio: "Barbeiro especialista em corte social e acabamento premium.",
      colorHex: "#2563eb",
      serviceIds: ["service-cut"]
    },
    {
      id: "staff-camila",
      name: "Camila Rocha",
      bio: "Nail designer focada em alongamento recorrente e acabamento fino.",
      colorHex: "#be185d",
      serviceIds: ["service-nail"]
    },
    {
      id: "staff-bruna",
      name: "Bruna Costa",
      bio: "Esteticista com agenda voltada a tratamentos faciais premium.",
      colorHex: "#0f766e",
      serviceIds: ["service-skin"]
    }
  ]
} as const;

const demoSlotMap: Record<string, string[]> = {
  "service-cut:staff-joao": ["09:15", "10:30", "13:45", "15:15"],
  "service-nail:staff-camila": ["10:00", "12:15", "14:30", "16:30"],
  "service-skin:staff-bruna": ["09:30", "11:00", "14:00", "16:45"]
};

const demoPixCopyPaste =
  "00020126580014BR.GOV.BCB.PIX0114+5511999999995204000053039865802BR5924STUDIO BELEZA FOCO6009SAO PAULO62070503***6304D0F0";

export function shouldUsePublicDemoFallback(input: { slug: string; error: unknown; enabled: boolean }) {
  if (!input.enabled || input.slug !== DEMO_PUBLIC_SLUG) {
    return false;
  }

  const { error } = input;
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PublicNotFoundError" ||
    error.message.includes("Espaco nao encontrado") ||
    error.name === "NotFoundError" ||
    error.message.includes("No Workspace found") ||
    error.message.includes("No record was found") ||
    error.message.includes("Can't reach database server")
  );
}

export function createDemoPublicSlotsResponse(date: string, serviceId: string, staffMemberId?: string) {
  const eligibleStaff = demoPublicWorkspaceResponse.staffMembers.filter(
    (staff) => staff.serviceIds.some((candidate) => candidate === serviceId) && (!staffMemberId || staff.id === staffMemberId)
  );

  return {
    date,
    staff: eligibleStaff.map((staff) => ({
      id: staff.id,
      name: staff.name,
      colorHex: staff.colorHex
    })),
    slots: eligibleStaff.flatMap((staff) =>
      (demoSlotMap[`${serviceId}:${staff.id}`] ?? []).map((time) => ({
        staffMemberId: staff.id,
        startAt: toIsoSlot(date, time)
      }))
    )
  };
}

export function createDemoPublicBookingResponse(input: { serviceId: string; startAt: string }) {
  const service = demoPublicWorkspaceResponse.services.find((item) => item.id === input.serviceId);
  if (!service) {
    return null;
  }

  const sanitizedStartAt = input.startAt.replace(/[^0-9]/g, "").slice(0, 12) || "slot";
  const appointmentId = `demo-${service.id}-${sanitizedStartAt}`;

  if (!service.depositEnabled) {
    return {
      appointmentId,
      status: "confirmed"
    };
  }

  return {
    appointmentId,
    status: "pending_payment",
    payment: {
      externalId: `demo-pix-${sanitizedStartAt}`,
      qrCode: null,
      pixCopyPaste: demoPixCopyPaste,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }
  };
}

function toIsoSlot(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}
