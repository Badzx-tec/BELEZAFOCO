import { Link } from "react-router-dom";
import { Button, Card, SectionTag } from "../components/ui";

const benefits = [
  "Agenda online com link público elegante",
  "Lembretes automáticos por WhatsApp e e-mail",
  "Sinal via Pix para reduzir faltas e no-show",
  "Dashboard com visão do dia e receita prevista",
  "Operação multiempresa pronta para vender rápido"
];

const featureCards = [
  {
    title: "Agenda que organiza a rotina",
    description: "Profissionais, buffers, encaixes, recursos compartilhados e prevenção de conflito sem gambiarra."
  },
  {
    title: "WhatsApp no centro da operação",
    description: "Confirmação, lembretes e reengajamento com fallback por e-mail e histórico de envio."
  },
  {
    title: "Pix para proteger a agenda",
    description: "Serviços com sinal opcional, conciliação e evidência de pagamento dentro do agendamento."
  }
];

const pricing = [
  {
    name: "Trial",
    price: "14 dias grátis",
    note: "Para implantar rápido e validar com clientes reais.",
    features: ["Até 2 profissionais", "Link público", "Lembretes básicos"]
  },
  {
    name: "Basic",
    price: "R$ 89/mês",
    note: "Negócios locais que precisam profissionalizar a agenda.",
    features: ["Até 4 profissionais", "Dashboard operacional", "Sinal Pix por serviço"]
  },
  {
    name: "Pro",
    price: "R$ 149/mês",
    note: "Operação mais forte, equipe maior e relatórios melhores.",
    features: ["Equipe e recursos ampliados", "Billing pronto para escalar", "Base para integrações"]
  }
];

const faqs = [
  {
    question: "Em quanto tempo eu consigo implantar?",
    answer: "Negócios pequenos conseguem operar em um único dia quando serviços, equipe e horários já estão definidos."
  },
  {
    question: "Funciona para barbearia, salão, nail e estética?",
    answer: "Sim. O produto foi pensado para múltiplos profissionais, serviços com durações diferentes e operação intensa por WhatsApp."
  },
  {
    question: "O sinal Pix é obrigatório?",
    answer: "Não. Cada serviço pode decidir se exige ou não sinal, permitindo ajustar a política conforme o tipo de atendimento."
  }
];

export function LandingPage() {
  return (
    <div className="overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="surface relative overflow-hidden px-6 py-6 sm:px-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-amber-100/50 to-transparent lg:block" />
          <div className="relative flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <SectionTag>Software para beleza</SectionTag>
                <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-slate-950 sm:text-5xl lg:text-6xl">
                  Agenda, WhatsApp e Pix no mesmo fluxo para vender melhor e faltar menos.
                </h1>
              </div>
              <div className="flex gap-3">
                <Link to="/app">
                  <Button variant="secondary">Ver dashboard</Button>
                </Link>
                <Link to="/b/demo-beleza">
                  <Button>Testar agendamento</Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <p className="max-w-2xl text-lg leading-8 text-slate-600">
                  O BELEZAFOCO foi desenhado para barbearias, salões, nail designers e estéticas que precisam de operação mais
                  profissional sem virar refém de planilha, confirmação manual e remarcação caótica.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <div key={benefit} className="rounded-3xl border border-slate-200/70 bg-white/75 px-4 py-4 text-sm font-medium text-slate-700">
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface-dark mesh-panel relative overflow-hidden px-6 py-6 text-white">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-amber-300/85">Hoje no Studio</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white/8 p-4">
                      <p className="text-sm text-slate-300">Receita prevista</p>
                      <p className="mt-3 text-3xl font-semibold">R$ 2.430</p>
                      <p className="mt-2 text-sm text-emerald-300">+18% na última semana</p>
                    </div>
                    <div className="rounded-3xl bg-white/8 p-4">
                      <p className="text-sm text-slate-300">Ocupação de hoje</p>
                      <p className="mt-3 text-3xl font-semibold">83%</p>
                      <p className="mt-2 text-sm text-slate-300">4 faltas evitadas por lembretes</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Próximo atendimento</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Ana Paula</p>
                        <p className="text-sm text-slate-300">Manicure em Gel com Camila</p>
                      </div>
                      <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200">Sinal Pix</span>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Link público</p>
                    <p className="mt-3 text-sm text-slate-200">belezafoco.com/b/demo-beleza</p>
                    <p className="mt-2 text-sm text-slate-400">Booking mobile-first com cores da marca e política do negócio.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          {featureCards.map((item) => (
            <Card key={item.title} className="px-6 py-6">
              <SectionTag>{item.title}</SectionTag>
              <p className="mt-4 text-lg font-semibold text-slate-950">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="px-6 py-6 sm:px-8">
            <SectionTag>Implantação rápida</SectionTag>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">Produto pronto para cidade pequena e operação local.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              A venda acontece mais rápido quando o dono enxerga resultado direto: menos falta, agenda mais organizada, cobrança
              melhor e imagem profissional no WhatsApp e no link público.
            </p>
            <div className="mt-6 space-y-4">
              {[
                "Cadastrar negócio, horários, equipe e serviços",
                "Publicar o link premium de agendamento",
                "Ativar lembretes automáticos e política de cancelamento",
                "Habilitar sinal Pix nos serviços mais concorridos"
              ].map((step, index) => (
                <div key={step} className="flex gap-4 rounded-3xl bg-slate-50 px-4 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    0{index + 1}
                  </span>
                  <p className="text-sm font-medium text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="px-6 py-6 sm:px-8" id="planos">
            <SectionTag>Planos</SectionTag>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {pricing.map((plan) => (
                <div key={plan.name} className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">{plan.name}</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-950">{plan.price}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{plan.note}</p>
                  <div className="mt-5 space-y-2 text-sm text-slate-700">
                    {plan.features.map((feature) => (
                      <div key={feature} className="rounded-2xl bg-slate-50 px-3 py-2">
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
              <h2 className="mt-4 text-3xl font-semibold text-slate-950">Perguntas que aparecem na venda</h2>
            </div>
            <Link to="/b/demo-beleza">
              <Button variant="secondary">Abrir demo pública</Button>
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {faqs.map((item) => (
              <div key={item.question} className="rounded-[26px] border border-slate-200/80 bg-white px-5 py-5">
                <p className="text-lg font-semibold text-slate-950">{item.question}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
