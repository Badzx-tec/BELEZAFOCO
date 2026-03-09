import { AppShell } from "../components/AppShell";
import { Card, SectionTag } from "../components/ui";
import { demoAgenda, demoChecklist, demoKpis, demoTopServices } from "../lib/demo";

export function DashboardPage() {
  return (
    <AppShell
      title="Studio Beleza Foco"
      subtitle="Painel desenhado para recepção, gestão e operação diária de negócios locais de beleza."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {demoKpis.map((item) => (
          <Card key={item.label} className="px-5 py-5">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{item.value}</p>
            <p className="mt-3 text-sm text-slate-500">{item.note}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <SectionTag>Agenda do dia</SectionTag>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">Tudo que a operação precisa ver em poucos segundos.</h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">Recepção ativa</span>
          </div>
          <div className="mt-6 space-y-3">
            {demoAgenda.map((item) => (
              <div key={`${item.time}-${item.client}`} className="grid gap-3 rounded-[26px] border border-slate-200/80 bg-white px-4 py-4 md:grid-cols-[92px_1fr_auto] md:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Horário</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{item.time}</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">{item.client}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.service} com {item.staff}
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">{item.status}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="px-6 py-6">
            <SectionTag>Onboarding guiado</SectionTag>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950">Checklist para implantar e cobrar rápido.</h3>
            <div className="mt-5 space-y-3">
              {demoChecklist.map((item) => (
                <div key={item.title} className="flex gap-4 rounded-[24px] bg-slate-50 px-4 py-4">
                  <div className={`mt-1 h-3 w-3 rounded-full ${item.done ? "bg-emerald-500" : "bg-amber-400"}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="px-6 py-6">
            <SectionTag>Serviços mais vendidos</SectionTag>
            <div className="mt-5 space-y-4">
              {demoTopServices.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-slate-500">{item.share}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-slate-950" style={{ width: `${item.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
