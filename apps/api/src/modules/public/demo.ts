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
    contactEmail: "contato@demo.belezafoco.local",
    logoUrl: null,
    about:
      "Agenda premium para barbearias, saloes, nails e estetica com booking mobile-first, lembretes no WhatsApp e sinal via Pix.",
    brandPrimary: "#111827",
    brandAccent: "#c48b5a",
    bookingPolicy:
      "Chegue com 5 minutos de antecedencia. Cancelamentos com menos de 24 horas podem gerar taxa conforme a politica do negocio.",
    publicBookingEnabled: true
  },
  services: [
    {
      id: "service-cut",
      name: "Corte Premium",
      category: "Barbearia",
      description: "Corte com acabamento completo, consultoria rapida e finalizacao premium.",
      durationMinutes: 45,
      priceValue: 5500,
      featured: true,
      depositEnabled: false
    },
    {
      id: "service-nail",
      name: "Manicure em Gel",
      category: "Nail Design",
      description: "Alongamento, acabamento e brilho duradouro para agenda disputada.",
      durationMinutes: 75,
      priceValue: 9000,
      featured: true,
      depositEnabled: true
    },
    {
      id: "service-skin",
      name: "Limpeza de Pele Premium",
      category: "Estetica",
      description: "Sessao completa com avaliacao, extracao e mascara calmante.",
      durationMinutes: 90,
      priceValue: 15000,
      featured: false,
      depositEnabled: true
    }
  ],
  staffMembers: [
    {
      id: "staff-joao",
      name: "Joao Silva",
      staffServices: [{ serviceId: "service-cut" }]
    },
    {
      id: "staff-camila",
      name: "Camila Rocha",
      staffServices: [{ serviceId: "service-nail" }]
    },
    {
      id: "staff-bruna",
      name: "Bruna Costa",
      staffServices: [{ serviceId: "service-skin" }]
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
    error.name === "NotFoundError" ||
    error.message.includes("No Workspace found") ||
    error.message.includes("No record was found") ||
    error.message.includes("Can't reach database server")
  );
}

export function createDemoPublicSlotsResponse(date: string, serviceId: string, staffMemberId?: string) {
  const eligibleStaff = demoPublicWorkspaceResponse.staffMembers.filter(
    (staff) =>
      staff.staffServices.some((service) => service.serviceId === serviceId) &&
      (!staffMemberId || staff.id === staffMemberId)
  );
  const selectedStaff = eligibleStaff[0];

  return {
    staffMemberId: selectedStaff?.id ?? staffMemberId ?? "",
    slots: selectedStaff
      ? (demoSlotMap[`${serviceId}:${selectedStaff.id}`] ?? []).map((time) => toIsoSlot(date, time))
      : []
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
