import Image from "next/image";
import Link from "next/link";
import { Card, DarkCard } from "@belezafoco/ui";
import { MarketingHero, PublicLayout, SectionHeading } from "@/components/site-chrome";
import { faqItems, niches, pricingPlans } from "@/lib/site-data";

export default function Home() {
  return (
    <PublicLayout>
      <MarketingHero />

      <section className="page-shell px-4 sm:px-6 lg:px-8">
        <DarkCard className="overflow-hidden p-1">
          <div className="grid gap-6 px-6 py-8 text-center md:grid-cols-3 md:px-12 md:py-12 md:text-left">
            <div>
              <p className="text-4xl font-bold tracking-tight text-white md:text-5xl">-41%</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">Menos faltas com lembretes</p>
            </div>
            <div>
              <p className="text-4xl font-bold tracking-tight text-white md:text-5xl">98%</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">Satisfacao mobile</p>
            </div>
            <div>
              <p className="text-4xl font-bold tracking-tight text-white md:text-5xl">Pix + Zap</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">Fluxo nativo sem atrito</p>
            </div>
          </div>
        </DarkCard>
      </section>

      <section className="page-shell space-y-8 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Nichos premium"
          title="Um produto que respeita o ritual de cada negocio de beleza."
          description="A mesma base transacional, com linguagem visual e fluxo operacional ajustados para o contexto de cada nicho."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {niches.map((niche) => (
            <Card key={niche.title} className="group overflow-hidden p-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[28px]">
                <Image src={niche.image} alt={niche.title} fill className="object-cover transition duration-500 group-hover:scale-[1.02]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 space-y-4 p-6">
                  <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
                    {niche.caption}
                  </span>
                  <div>
                    <h3 className="text-3xl font-bold text-white">{niche.title}</h3>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-white/75">{niche.description}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="page-shell grid gap-6 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <Card className="p-8">
          <SectionHeading
            eyebrow="Core operacional"
            title="Agenda, CRM, financeiro e cobranca com o mesmo idioma."
            description="Nada de colar ferramentas soltas. O produto nasce com multi-tenant, auditoria, recebiveis, ledger e automacoes de lembrete."
          />
        </Card>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            ["Agenda online", "Booking premium com sinal e buffers", "Slots com regras por profissional, excecoes, folgas, cancelamento, reagendamento e no-show."],
            ["WhatsApp Cloud", "Lembretes reais com tracking", "Templates, retries, webhook de status e logs por cliente e agendamento."],
            ["Pix Mercado Pago", "Receita confirmada com idempotencia", "QR, webhook seguro, reconciliacao, trilha auditavel e atualizacao automatica do booking."],
            ["Financeiro", "Fluxo de caixa e comissao no mesmo cockpit", "Recebido vs previsto, contas a pagar, centros de custo e exportacao CSV pronta para PDF."]
          ].map(([eyebrow, title, description]) => (
            <Card key={title} className="p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">{eyebrow}</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="page-shell space-y-8 px-4 py-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Investimento" title="O software que se paga no primeiro mes." align="center" />
        <div className="grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) =>
            plan.featured ? (
              <DarkCard key={plan.name} className="relative overflow-hidden p-8 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(194,107,54,0.24),transparent_55%)]" />
                <div className="relative space-y-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/70">{plan.highlight}</p>
                    <h3 className="mt-3 text-3xl font-bold">{plan.name}</h3>
                  </div>
                  <div className="flex items-end gap-2">
                    <p className="text-5xl font-bold">{plan.price}</p>
                    <p className="pb-1 text-sm text-white/60">{plan.cadence}</p>
                  </div>
                  <ul className="space-y-3 text-sm text-white/80">
                    {plan.features.map((feature) => (
                      <li key={feature}>- {feature}</li>
                    ))}
                  </ul>
                  <Link href="/cadastro" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-slate-950">
                    {plan.cta}
                  </Link>
                </div>
              </DarkCard>
            ) : (
              <Card key={plan.name} className="p-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{plan.highlight}</p>
                    <h3 className="mt-3 text-3xl font-bold text-slate-950">{plan.name}</h3>
                  </div>
                  <div className="flex items-end gap-2">
                    <p className="text-5xl font-bold text-slate-950">{plan.price}</p>
                    <p className="pb-1 text-sm text-slate-400">{plan.cadence}</p>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-600">
                    {plan.features.map((feature) => (
                      <li key={feature}>- {feature}</li>
                    ))}
                  </ul>
                  <Link href="/cadastro" className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-bold text-slate-950">
                    {plan.cta}
                  </Link>
                </div>
              </Card>
            )
          )}
        </div>
      </section>

      <section className="page-shell space-y-8 px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Perguntas que surgem antes do rollout." description="As respostas abaixo ja refletem a arquitetura e as integracoes escolhidas para o greenfield." />
        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.map((item) => (
            <Card key={item.question} className="p-6">
              <h3 className="text-xl font-bold text-slate-950">{item.question}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{item.answer}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="page-shell px-4 pb-4 sm:px-6 lg:px-8">
        <DarkCard className="relative overflow-hidden p-10 md:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(194,107,54,0.16),transparent_65%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.65fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/70">Pronto para operar</p>
              <h2 className="text-balance text-4xl font-bold tracking-tight text-white md:text-5xl">A nova operacao premium comeca agora.</h2>
              <p className="max-w-2xl text-lg leading-8 text-white/70">
                Saia de planilhas, confirmacoes manuais e visibilidade fragmentada. Entre com agenda, WhatsApp, Pix e financeiro ja conectados.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/cadastro" className="inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-base font-bold text-slate-950">
                  Criar conta gratis
                </Link>
                <Link href="/app" className="inline-flex h-14 items-center justify-center rounded-full border border-white/15 px-8 text-base font-bold text-white">
                  Ver cockpit
                </Link>
              </div>
            </div>
            <div className="relative aspect-[10/9] overflow-hidden rounded-[34px] border border-white/10 bg-white/5">
              <Image src="/marketing/mobile-booking-premium.svg" alt="Experiencia mobile premium" fill className="object-cover" />
            </div>
          </div>
        </DarkCard>
      </section>
    </PublicLayout>
  );
}
