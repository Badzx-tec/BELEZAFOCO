import { Panel } from "@/components/app-shell";
import { clientCards } from "@/lib/site-data";

export default function ClientsPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Clientes ativos" description="Base atual filtrada por recorrencia.">
          <p className="text-4xl font-bold text-slate-950">328</p>
        </Panel>
        <Panel title="Inativos" description="Sem visita nos ultimos 45 dias.">
          <p className="text-4xl font-bold text-slate-950">42</p>
        </Panel>
        <Panel title="Consentimento de campanha" description="Opt-in pronto para WhatsApp e email.">
          <p className="text-4xl font-bold text-slate-950">81%</p>
        </Panel>
      </div>

      <Panel title="Carteira priorizada" description="Segmentos para fidelizacao, reativacao e servico premium.">
        <div className="grid gap-4 md:grid-cols-3">
          {clientCards.map((client) => (
            <div key={client.name} className="rounded-[26px] border border-slate-200/70 bg-white/70 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">{client.segment}</p>
              <h3 className="mt-3 text-xl font-bold text-slate-950">{client.name}</h3>
              <p className="mt-2 text-sm text-slate-500">{client.meta}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Ultima visita - {client.lastVisit}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
