import { Link } from "react-router-dom";
import { Badge, Button, Card, SectionTag } from "../components/ui";

const benefits = [
  "Agenda online com link publico elegante",
  "Lembretes automaticos por WhatsApp e e-mail",
  "Sinal via Pix para reduzir faltas e no-show",
  "Dashboard com visao do dia e receita prevista",
  "Operacao multiempresa pronta para vender rapido"
];

const featureCards = [
  {
    title: "Agenda que organiza a rotina",
    description: "Profissionais, buffers, encaixes e recursos compartilhados sem planilha improvisada.",
    tag: "Operacao"
  },
  {
    title: "WhatsApp no centro da agenda",
    description: "Confirmacao, lembrete e reengajamento com tolerancia a falhas e historico de envio.",
    tag: "Comunicacao"
  },
  {
    title: "Pix para proteger a receita",
    description: "Servicos com sinal opcional, webhook seguro e evidencia do pagamento no agendamento.",
    tag: "Cobranca"
  }
];

const nicheCards = [
  {
    title: "Barbearias",
    description: "Agenda rapida, encaixe por barbeiro e sinal nos horarios mais disputados.",
    image: "/niches/barbearia-card.svg"
  },
  {
    title: "Salao e estetica",
    description: "Fluxo premium para servicos mais longos, sala compartilhada e recorrencia.",
    image: "/niches/salao-card.svg"
  },
  {
    title: "Nail design",
    description: "Experiencia mobile forte, sinal via Pix e fidelizacao por retorno.",
    image: "/niches/nail-card.svg"
  }
];

const pricing = [
  {
    name: "Trial",
    price: "14 dias gratis",
    note: "Para implantar rapido e validar com clientes reais.",
    featured: false,
    features: ["Ate 2 profissionais", "Link publico", "Lembretes basicos"]
  },
  {
    name: "Basic",
    price: "R$ 89/mes",
    note: "Negocios locais que precisam profissionalizar a agenda.",
    featured: true,
    features: ["Ate 4 profissionais", "Dashboard operacional", "Sinal Pix por servico"]
  },
  {
    name: "Pro",
    price: "R$ 149/mes",
    note: "Operacao mais forte, equipe maior e relatorios melhores.",
    featured: false,
    features: ["Equipe ampliada", "Billing pronto para escalar", "Base para integracoes"]
  }
];

const faqs = [
  {
    question: "Em quanto tempo eu consigo implantar?",
    answer: "Negocios pequenos conseguem operar em um unico dia quando servicos, equipe e horarios ja estao definidos."
  },
  {
    question: "Funciona para barbearia, salao, nail e estetica?",
    answer: "Sim. O produto foi desenhado para servicos com duracoes diferentes, multiplos profissionais e fluxo forte por WhatsApp."
  },
  {
    question: "O sinal Pix e obrigatorio?",
    answer: "Nao. Cada servico decide se exige ou nao sinal, conforme o risco de falta e a disputa pelo horario."
  }
];

const proofStats = [
  { value: "-41%", label: "faltas com lembretes" },
  { value: "1 dia", label: "para implantar o basico" },
  { value: "Pix + WhatsApp", label: "na mesma operacao" }
];

export function LandingPage() {
  return (
    <div className="relative overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(194,107,54,0.16),transparent_54%)]" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8">
        <header className="surface overflow-hidden px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-slate-950 text-sm font-semibold text-white">BF</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">BELEZAFOCO</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">SaaS de agenda e cobranca para beleza</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to="/auth">
                  <Button variant="secondary">Entrar no painel</Button>
                </Link>
                <Link to="/auth">
                  <Button>Criar conta</Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <div>
                  <SectionTag>Software para beleza</SectionTag>
                  <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold text-slate-950 sm:text-5xl lg:text-6xl">
                    Agenda, WhatsApp e Pix no mesmo fluxo para vender melhor e faltar menos.
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                    BELEZAFOCO foi desenhado para barbearias, saloes, nail designers e esteticas que precisam de operacao mais
                    profissional sem virar refem de planilha, confirmacao manual e reagendamento caotico.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link to="/auth">
                    <Button size="lg">Criar conta agora</Button>
                  </Link>
                  <a href="#planos">
                    <Button variant="secondary" size="lg">
                      Ver planos
                    </Button>
                  </a>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <div key={benefit} className="rounded-[24px] border border-slate-200/70 bg-white/72 px-4 py-4 text-sm font-medium text-slate-700">
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface-dark mesh-panel relative overflow-hidden px-5 py-5 text-white">
                <div className="absolute right-5 top-5">
                  <Badge tone="accent" className="bg-amber-400/12 text-amber-200 ring-amber-300/20">
                    Pronto para vender
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[30px] border border-white/10 bg-white/7 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">Hoje no estudio</p>
                        <p className="mt-3 text-2xl font-semibold">Receita prevista de R$ 2.430</p>
                      </div>
                      <Badge tone="success" className="bg-emerald-400/12 text-emerald-200 ring-emerald-300/20">
                        +18% semana
                      </Badge>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[24px] bg-white/8 px-4 py-4">
                        <p className="text-sm text-slate-300">Ocupacao de hoje</p>
                        <p className="mt-3 text-3xl font-semibold">83%</p>
                        <p className="mt-2 text-sm text-slate-300">com recepcao ativa</p>
                      </div>
                      <div className="rounded-[24px] bg-white/8 px-4 py-4">
                        <p className="text-sm text-slate-300">Faltas evitadas</p>
                        <p className="mt-3 text-3xl font-semibold">4</p>
                        <p className="mt-2 text-sm text-slate-300">por lembretes e sinal</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-white/10 bg-white/6 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Proximo atendimento</p>
                        <p className="mt-3 text-lg font-semibold">Ana Paula</p>
                        <p className="mt-2 text-sm text-slate-300">Manicure em Gel com Camila</p>
                      </div>
                      <Badge tone="accent" className="bg-amber-400/12 text-amber-200 ring-amber-300/20">
                        Sinal Pix
                      </Badge>
                    </div>
                    <div className="mt-4 rounded-[24px] bg-black/20 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Link publico</p>
                      <p className="mt-2 text-sm font-semibold text-white">belezafoco.com/b/seu-negocio</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">UX mobile-first com identidade da marca e politica do negocio.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <img
                    src="/marketing/hero-dashboard.svg"
                    alt="Mockup do dashboard BELEZAFOCO em desktop"
                    className="w-full rounded-[28px] border border-white/10 bg-white/5 p-2"
                  />
                  <img
                    src="/marketing/hero-mobile-booking.svg"
                    alt="Mockup do booking publico BELEZAFOCO em celular"
                    className="w-full rounded-[28px] border border-white/10 bg-white/5 p-2"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-[30px] bg-slate-950 px-5 py-5 text-white sm:grid-cols-3">
              {proofStats.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-3xl font-semibold">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          {featureCards.map((item) => (
            <Card key={item.title} interactive className="px-6 py-6">
              <SectionTag>{item.tag}</SectionTag>
              <p className="mt-4 text-2xl font-semibold text-slate-950">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                pronto para operacao local
              </div>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {nicheCards.map((item) => (
            <Card key={item.title} interactive className="overflow-hidden p-3">
              <img src={item.image} alt={item.title} className="w-full rounded-[24px]" />
              <div className="px-3 pb-3 pt-5">
                <SectionTag>Segmento</SectionTag>
                <p className="mt-4 text-2xl font-semibold text-slate-950">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <Card className="px-6 py-6 sm:px-8">
            <SectionTag>Implantacao rapida</SectionTag>
            <h2 className="mt-4 text-balance text-3xl font-semibold text-slate-950">Produto pensado para cidade pequena e venda local.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              A venda acontece mais rapido quando o dono enxerga efeito direto: menos falta, agenda mais organizada, cobranca melhor e
              imagem profissional no WhatsApp e no link publico.
            </p>
            <div className="mt-6 space-y-4">
              {[
                "Cadastrar negocio, horarios, equipe e servicos",
                "Publicar o link premium de agendamento",
                "Ativar lembretes e politica de cancelamento",
                "Habilitar sinal Pix nos horarios mais disputados"
              ].map((step, index) => (
                <div key={step} className="flex gap-4 rounded-[26px] border border-slate-200/70 bg-white/72 px-4 py-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    0{index + 1}
                  </span>
                  <p className="text-sm font-medium leading-6 text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="px-6 py-6 sm:px-8" id="planos">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionTag>Planos</SectionTag>
                <h2 className="mt-4 text-3xl font-semibold text-slate-950">Planos para testar, vender e escalar.</h2>
              </div>
              <Badge tone="success">Trial incluido</Badge>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {pricing.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-[28px] border px-5 py-5 ${
                    plan.featured
                      ? "border-slate-950 bg-slate-950 text-white shadow-[0_30px_70px_-40px_rgba(15,23,42,0.8)]"
                      : "border-slate-200/80 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${plan.featured ? "text-white/65" : "text-slate-400"}`}>{plan.name}</p>
                    {plan.featured ? <Badge tone="accent">Mais vendido</Badge> : null}
                  </div>
                  <p className={`mt-4 text-3xl font-semibold ${plan.featured ? "text-white" : "text-slate-950"}`}>{plan.price}</p>
                  <p className={`mt-3 text-sm leading-6 ${plan.featured ? "text-slate-300" : "text-slate-600"}`}>{plan.note}</p>
                  <div className="mt-5 space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className={`rounded-2xl px-3 py-2 ${plan.featured ? "bg-white/8 text-white" : "bg-slate-50 text-slate-700"}`}
                      >
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="surface px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionTag>FAQ</SectionTag>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950">Perguntas que surgem na venda.</h2>
            </div>
            <Link to="/auth">
              <Button variant="secondary">Criar conta</Button>
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {faqs.map((item) => (
              <div key={item.question} className="rounded-[26px] border border-slate-200/80 bg-white/82 px-5 py-5">
                <p className="text-lg font-semibold text-slate-950">{item.question}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <Card className="overflow-hidden px-6 py-6 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <SectionTag>Proximo passo</SectionTag>
              <h2 className="mt-4 text-balance text-3xl font-semibold text-slate-950">
                Se a agenda e o WhatsApp ainda vivem separados, o negocio esta perdendo dinheiro.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Crie sua conta, publique seu link de agendamento e coloque a operacao inteira para rodar em fluxo real.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg">Comecar agora</Button>
              </Link>
              <a href="#planos">
                <Button variant="secondary" size="lg">
                  Ver planos
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
