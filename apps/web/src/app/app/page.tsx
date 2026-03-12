import Image from "next/image";
import { MetricTile, Panel } from "@/components/app-shell";
import { agendaItems } from "@/lib/site-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Receita hoje" value="R$ 2.840" hint="+12.4% vs quinta passada" />
        <MetricTile label="Ocupacao" value="82%" hint="Picos de agenda entre 14h e 18h" />
        <MetricTile label="Agendamentos" value="14 hoje" hint="Proximo horario 14:30" />
        <MetricTile label="Time ativo" value="06 prof." hint="3 cortes, 2 estetica, 1 nail" dark />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Proximos horarios" description="Snapshot operacional alinhado ao draft premium do Superdesign.">
          <div className="space-y-3">
            {agendaItems.map((item) => (
              <div key={`${item.time}-${item.client}`} className="flex flex-col gap-3 rounded-[26px] border border-slate-200/70 bg-white/70 p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-24">
                  <p className="text-lg font-bold text-slate-950">{item.time}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{item.status}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-950">{item.client}</p>
                  <p className="text-sm text-slate-500">{item.service} - {item.staff}</p>
                </div>
                <span className="inline-flex rounded-full bg-[color:var(--color-accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Snapshot financeiro" description="Recebimento, previsao e velocidade do caixa." dark>
          <div className="space-y-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
              <Image src="/finance/ledger-orbit.svg" alt="Orbita financeira" fill className="object-cover" />
            </div>
            <div className="grid gap-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">Recebiveis previstos</p>
                <p className="mt-2 text-2xl font-bold text-white">R$ 7.920</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">Comissoes provisionadas</p>
                <p className="mt-2 text-2xl font-bold text-white">R$ 642</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
