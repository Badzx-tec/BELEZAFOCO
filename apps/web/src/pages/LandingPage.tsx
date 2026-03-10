import { Link } from "react-router-dom";
import { Badge, Button, Card, SectionTitle } from "../components/ui";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(196,139,90,0.22),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(15,23,42,0.08),_transparent_24%),linear-gradient(180deg,#fcfaf6_0%,#f7f1e7_52%,#f4ede2_100%)] text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 md:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">BELEZAFOCO</p>
          <p className="mt-2 text-sm text-slate-500">SaaS para barbearias, saloes, nails e esteticas</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app"><Button variant="secondary">Entrar</Button></Link>
          <Link to="/app"><Button>Teste gratis</Button></Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 pb-16 md:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Card className="overflow-hidden bg-slate-950 text-white">
            <div className="relative space-y-7">
              <div className="absolute -right-10 top-4 h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: "rgba(196, 139, 90, 0.35)" }} />
              <Badge tone="warning">Foco em venda local e implantacao rapida</Badge>
              <div className="relative space-y-5">
                <h1 className="font-display text-5xl leading-tight md:text-6xl">Agenda online com WhatsApp, Pix e cara de software premium.</h1>
                <p className="max-w-2xl text-base leading-8 text-white/72">
                  Reduza faltas, profissionalize a operacao e entregue um link de agendamento bonito para clientes de barbearia, salao, nail designer ou estetica sem depender de planilha e mensagem manual.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/app"><Button>Comecar teste gratis</Button></Link>
                  <a href="#precos"><Button variant="secondary">Ver planos</Button></a>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  "Link publico premium por slug",
                  "Lembretes e confirmacao automatica",
                  "Sinal via Pix para reduzir no-show"
                ].map((item) => (
                  <div key={item} className="rounded-3xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/72">{item}</div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            <SectionTitle eyebrow="Por que vende" title="O que faz diferenca no cliente local" description="O produto foi desenhado para resolver os gargalos que mais travam a agenda de negocios pequenos e medios." />
            <div className="grid gap-4">
              {[
                {
                  title: "Agenda sem conflito",
                  body: "Profissionais, recursos, buffers e horarios no mesmo motor de disponibilidade."
                },
                {
                  title: "Operacao mais profissional",
                  body: "Dashboard com agenda do dia, ocupacao, receita prevista e checklist de implantacao."
                },
                {
                  title: "Menos falta e menos atrito",
                  body: "Base pronta para lembretes, confirmacao automatica e sinal via Pix."
                }
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{item.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Onboarding em minutos",
              body: "Negocio, horario, servicos e equipe em um fluxo guiado para publicar rapido."
            },
            {
              title: "Agendamento publico mobile-first",
              body: "Fluxo simples para quem vem do WhatsApp e precisa reservar em poucos toques."
            },
            {
              title: "Base de crescimento",
              body: "Trial, planos, billing, webhook seguro e deploy preparado para producao."
            }
          ].map((item) => (
            <Card key={item.title} className="space-y-3">
              <p className="text-lg font-semibold text-slate-900">{item.title}</p>
              <p className="text-sm leading-7 text-slate-500">{item.body}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="space-y-4">
            <SectionTitle eyebrow="Interface" title="Software com cara de mercado" description="Componentes consistentes, onboarding orientado a acao e booking publico elegante." />
            <div className="grid gap-3">
              {[
                "Landing para vender o SaaS",
                "Cockpit com checklist, agenda do dia e cadastros",
                "Pagina publica por slug com brand do negocio"
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{item}</div>
              ))}
            </div>
          </Card>

          <Card id="precos" className="space-y-4">
            <SectionTitle eyebrow="Precos" title="Planos pensados para cidade pequena e media" description="Entrada facil, implantacao curta e espaco para crescer sem trocar de sistema." />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { name: "Trial", price: "Gratis por 14 dias", body: "Validacao rapida e implantacao do primeiro link." },
                { name: "Basic", price: "A partir de R$ 89", body: "Agenda, equipe, clientes e booking publico." },
                { name: "Pro", price: "A partir de R$ 149", body: "Mais equipe, mais volume e operacao mais sofisticada." }
              ].map((plan) => (
                <div key={plan.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{plan.name}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{plan.price}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{plan.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4">
            <SectionTitle eyebrow="FAQ" title="Perguntas que o cliente faz antes de fechar" />
            <div className="space-y-3 text-sm leading-7 text-slate-500">
              <div><span className="font-semibold text-slate-900">Funciona para barbearia e salao?</span><br />Sim. A base foi modelada para operacao de beleza com equipe, servicos, recursos e agenda publica.</div>
              <div><span className="font-semibold text-slate-900">Tem Pix para sinal?</span><br />Sim. O core ja esta preparado para Mercado Pago com webhook e status de pagamento.</div>
              <div><span className="font-semibold text-slate-900">Posso vender rapido na minha cidade?</span><br />Sim. O produto foi pensado para implantacao curta, proposta de valor objetiva e rotina local.</div>
            </div>
          </Card>

          <Card className="space-y-5 bg-slate-950 text-white">
            <SectionTitle eyebrow="CTA" title="Coloque um negocio local para operar melhor ainda esta semana." description="Publique um booking premium, reduza faltas e profissionalize a agenda sem complicar o dia a dia." />
            <div className="flex flex-wrap gap-3">
              <Link to="/app"><Button>Iniciar teste gratis</Button></Link>
              <Link to="/app"><Button variant="secondary">Agendar demonstracao</Button></Link>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
