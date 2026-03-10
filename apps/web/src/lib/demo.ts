export const demoKpis = [
  { label: "Agenda de hoje", value: "18", note: "7 confirmados até agora" },
  { label: "Receita prevista", value: "R$ 2.430", note: "Com sinal Pix em 4 serviços" },
  { label: "Taxa de ocupação", value: "83%", note: "Meta saudável para a semana" },
  { label: "Faltas no mês", value: "3", note: "Menos 41% com lembretes automáticos" }
];

export const demoAgenda = [
  { time: "09:00", client: "Pedro Gomes", service: "Corte Premium", staff: "João", status: "Confirmado" },
  { time: "10:30", client: "Marina Souza", service: "Limpeza de Pele Premium", staff: "Bruna", status: "Sinal pago" },
  { time: "13:00", client: "Ana Paula", service: "Manicure em Gel", staff: "Camila", status: "Pendente confirmação" },
  { time: "15:15", client: "Juliana Melo", service: "Barba Terapia", staff: "João", status: "Confirmado" }
];

export const demoChecklist = [
  { title: "Identidade do negócio", detail: "Nome, cores, WhatsApp e apresentação pública", done: true },
  { title: "Horários e folgas", detail: "Agenda com janelas reais de operação", done: true },
  { title: "Catálogo e preços", detail: "Serviços com duração, buffer e sinal opcional", done: true },
  { title: "Equipe e permissões", detail: "Perfis por papel e agenda individual", done: false },
  { title: "Templates automáticos", detail: "WhatsApp 24h e 2h antes", done: false }
];

export const demoTopServices = [
  { name: "Corte Premium", share: 34 },
  { name: "Manicure em Gel", share: 26 },
  { name: "Limpeza de Pele Premium", share: 22 },
  { name: "Barba Terapia", share: 18 }
];

export const demoPublicWorkspace = {
  workspace: {
    name: "Studio Beleza Foco",
    slug: "demo-beleza",
    timezone: "America/Sao_Paulo",
    address: "Rua das Flores, 120 - Centro",
    whatsapp: "+55 11 99999-9999",
    logoUrl: null,
    description:
      "Booking mobile-first com identidade premium, sinal via Pix e atendimento preparado para salao, nail e estetica.",
    bookingPolicy:
      "Chegue com 5 minutos de antecedencia. Cancelamentos com menos de 24 horas podem gerar taxa conforme a politica do negocio.",
    brandPrimaryColor: "#111827",
    brandAccentColor: "#c26b36",
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
      depositEnabled: false,
      depositAmount: null,
      featured: true
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
      depositEnabled: true,
      depositAmount: 2000,
      featured: true
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
      depositEnabled: true,
      depositAmount: 3000,
      featured: false
    }
  ],
  staffMembers: [
    {
      id: "staff-joao",
      name: "Joao Silva",
      bio: "Barbeiro especialista em corte social, barba desenhada e encaixe rapido no horario de almoco.",
      colorHex: "#2563eb",
      serviceIds: ["service-cut"]
    },
    {
      id: "staff-camila",
      name: "Camila Rocha",
      bio: "Nail designer focada em alongamento, manutencao recorrente e atendimento com alta taxa de retorno.",
      colorHex: "#be185d",
      serviceIds: ["service-nail"]
    },
    {
      id: "staff-bruna",
      name: "Bruna Costa",
      bio: "Esteticista com agenda premium para tratamentos faciais e recorrencia.",
      colorHex: "#0f766e",
      serviceIds: ["service-skin"]
    }
  ]
};

const demoSlotMap: Record<string, string[]> = {
  "service-cut:staff-joao": ["09:15", "10:30", "13:45", "15:15"],
  "service-nail:staff-camila": ["10:00", "12:15", "14:30", "16:30"],
  "service-skin:staff-bruna": ["09:30", "11:00", "14:00", "16:45"]
};

function slotToIso(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

export function createDemoSlotPayload(date: string, selectedServiceId: string, selectedStaffId?: string) {
  const eligibleStaff = demoPublicWorkspace.staffMembers.filter((staff) =>
    staff.serviceIds.includes(selectedServiceId) && (!selectedStaffId || staff.id === selectedStaffId)
  );

  return {
    date,
    staff: eligibleStaff.map((staff) => ({
      id: staff.id,
      name: staff.name,
      colorHex: staff.colorHex
    })),
    slots: eligibleStaff.flatMap((staff) =>
      (demoSlotMap[`${selectedServiceId}:${staff.id}`] ?? []).map((time) => ({
        staffMemberId: staff.id,
        startAt: slotToIso(date, time)
      }))
    )
  };
}

export function createDemoBookingResponse(serviceId: string) {
  const service = demoPublicWorkspace.services.find((item) => item.id === serviceId);
  const appointmentId = `demo-${serviceId}-${Date.now()}`;

  if (!service?.depositEnabled || !service.depositAmount) {
    return {
      appointmentId,
      status: "confirmed",
      payment: null
    };
  }

  return {
    appointmentId,
    status: "pending_payment",
    payment: {
      externalId: `demo-pix-${Date.now()}`,
      qrCode: "data:image/svg+xml;base64,",
      pixCopyPaste: `00020126580014BR.GOV.BCB.PIX0114+5511999999995204000053039865802BR5924STUDIO BELEZA FOCO6009SAO PAULO62070503***6304D0F0`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }
  };
}
