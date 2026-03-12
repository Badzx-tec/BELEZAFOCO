import { Card, DarkCard } from "@belezafoco/ui";
import { PublicLayout, SectionHeading } from "@/components/site-chrome";
import { pricingPlans } from "@/lib/site-data";

export default function PricingPage() {
  return (
    <PublicLayout>
      <section className="page-shell space-y-8 px-4 pt-6 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Tabela de investimento"
          title="Planos desenhados para sair do caos operacional sem perder margem."
          description="O custo combina agenda, automacao, financeiro e rollout premium. Nao sao modulos avulsos."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) =>
            plan.featured ? (
              <DarkCard key={plan.name} className="p-8 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/70">{plan.highlight}</p>
                <h2 className="mt-4 text-3xl font-bold">{plan.name}</h2>
                <p className="mt-6 text-5xl font-bold">{plan.price}</p>
                <p className="mt-1 text-sm text-white/60">{plan.cadence}</p>
                <ul className="mt-8 space-y-3 text-sm text-white/80">
                  {plan.features.map((feature) => (
                    <li key={feature}>- {feature}</li>
                  ))}
                </ul>
              </DarkCard>
            ) : (
              <Card key={plan.name} className="p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{plan.highlight}</p>
                <h2 className="mt-4 text-3xl font-bold text-slate-950">{plan.name}</h2>
                <p className="mt-6 text-5xl font-bold text-slate-950">{plan.price}</p>
                <p className="mt-1 text-sm text-slate-400">{plan.cadence}</p>
                <ul className="mt-8 space-y-3 text-sm text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature}>- {feature}</li>
                  ))}
                </ul>
              </Card>
            )
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
