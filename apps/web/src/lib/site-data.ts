export const niches = [
  {
    title: "Barbearias",
    caption: "Estilo masculino",
    description: "Fila inteligente, deposito via Pix e agenda com buffers para os horarios mais disputados do sabado.",
    image: "/niches/barbearia-premium.svg"
  },
  {
    title: "Salao & Spa",
    caption: "Luxo feminino",
    description: "Cockpit unico para equipes, salas compartilhadas e fluxo financeiro em tempo real.",
    image: "/niches/salao-premium.svg"
  },
  {
    title: "Nail Design",
    caption: "Especialistas",
    description: "Reserva mobile-first focada em recorrencia, pacotes e fidelizacao de clientes premium.",
    image: "/niches/nail-premium.svg"
  }
] as const;

export const pricingPlans = [
  {
    name: "Essencial",
    highlight: "Para comecar",
    price: "R$ 0",
    cadence: "/14 dias trial",
    features: ["Ate 2 profissionais", "Link publico premium", "Lembretes basicos"],
    cta: "Iniciar trial",
    featured: false
  },
  {
    name: "Profissional",
    highlight: "Mais assinado",
    price: "R$ 89",
    cadence: "/mes",
    features: ["Ate 6 profissionais", "Dashboard financeiro live", "Sinal via Pix", "API e webhooks"],
    cta: "Selecionar plano",
    featured: true
  },
  {
    name: "Enterprise",
    highlight: "Crescimento total",
    price: "R$ 149",
    cadence: "/mes",
    features: ["Profissionais ilimitados", "Multi-unidade", "Relatorios avancados", "Suporte prioritario"],
    cta: "Falar com consultor",
    featured: false
  }
] as const;

export const faqItems = [
  {
    question: "O que ja vem pronto no onboarding?",
    answer: "Workspace demo, servicos, profissionais, agenda inicial, categorias financeiras e templates de lembretes."
  },
  {
    question: "Como funciona o sinal via Pix?",
    answer: "A reserva pode criar um pagamento Mercado Pago com QR e copia-e-cola, sempre com idempotencia e webhook validado."
  },
  {
    question: "Posso usar WhatsApp real?",
    answer: "Sim. O produto nasce com provider abstraction e suporte a templates, lembretes 24h/2h e logs de envio."
  },
  {
    question: "Serve para mais de um nicho?",
    answer: "Sim. O modelo atende barbearias, saloes, estetica, lashes, sobrancelha, maquiagem e operacoes locais premium."
  }
] as const;

export const agendaItems = [
  {
    time: "14:30",
    status: "Confirmado",
    client: "Juliana Ribeiro",
    service: "Mechas + Tratamento",
    staff: "Aline Oliveira",
    badge: "Sinal pago"
  },
  {
    time: "15:15",
    status: "Agora",
    client: "Marcos Vinicius",
    service: "Corte degrade & barba",
    staff: "Bruno Silva",
    badge: "Atendendo"
  },
  {
    time: "16:00",
    status: "Agendado",
    client: "Renata Mello",
    service: "Manicure spa",
    staff: "Leticia Santos",
    badge: "Sinal pendente"
  },
  {
    time: "17:30",
    status: "Agendado",
    client: "Roberto Junior",
    service: "Corte simples",
    staff: "Bruno Silva",
    badge: "Sem deposito"
  }
] as const;

export const clientCards = [
  {
    name: "Ana Luiza Silva",
    segment: "Recorrente premium",
    meta: "6 visitas em 90 dias",
    lastVisit: "Ontem"
  },
  {
    name: "Roberto Junior",
    segment: "Risco de churn",
    meta: "45 dias sem voltar",
    lastVisit: "26 jan"
  },
  {
    name: "Juliana Ribeiro",
    segment: "WhatsApp opt-in",
    meta: "Alta resposta para campanhas",
    lastVisit: "Hoje"
  }
] as const;

export const ledgerRows = [
  { label: "Receita confirmada", amount: "+R$ 2.840,00", tone: "positive" },
  { label: "Comissoes provisionadas", amount: "-R$ 642,00", tone: "negative" },
  { label: "Caixa previsto 18h", amount: "R$ 7.920,00", tone: "neutral" },
  { label: "Inadimplencia do mes", amount: "R$ 320,00", tone: "negative" }
] as const;
