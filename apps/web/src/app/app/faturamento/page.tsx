import { Card, DarkCard } from "@belezafoco/ui";

export default function BillingPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <DarkCard className="p-8 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/70">Plano atual</p>
        <h2 className="mt-4 text-3xl font-bold">Profissional</h2>
        <p className="mt-3 text-sm leading-7 text-white/70">Ate 6 profissionais, financeiro live, Pix, WhatsApp e auditoria completos.</p>
        <p className="mt-8 text-5xl font-bold">R$ 89</p>
        <p className="mt-1 text-sm text-white/60">Renovacao em 12 dias</p>
      </DarkCard>

      <Card className="p-8">
        <h2 className="text-3xl font-bold text-slate-950">Uso e limites</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["Profissionais ativos", "4 de 6"],
            ["Agendamentos do mes", "184"],
            ["Templates WhatsApp", "3 em uso"],
            ["Recebiveis conciliados", "98%"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] border border-slate-200/70 bg-white/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
