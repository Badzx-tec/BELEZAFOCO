import { Panel } from "@/components/app-shell";
import { ledgerRows } from "@/lib/site-data";

export default function FinancePage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Panel title="Visao executiva" description="Fluxo de caixa, recebido vs previsto e comissao em uma tela.">
        <div className="grid gap-4">
          {ledgerRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-[24px] border border-slate-200/70 bg-white/70 p-4">
              <p className="text-sm font-semibold text-slate-600">{row.label}</p>
              <p className={`text-base font-bold ${row.tone === "positive" ? "text-emerald-600" : row.tone === "negative" ? "text-rose-600" : "text-slate-950"}`}>
                {row.amount}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Trilha auditavel" description="Ledger imutavel, ajustes por lancamento e reconciliacao preparada para webhooks.">
        <div className="overflow-hidden rounded-[28px] border border-slate-200/70">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-white/75">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-500">Tipo</th>
                <th className="px-4 py-3 font-bold text-slate-500">Referencia</th>
                <th className="px-4 py-3 font-bold text-slate-500">Valor</th>
                <th className="px-4 py-3 font-bold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/60">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-950">receivable</td>
                <td className="px-4 py-3 text-slate-500">Apto 14:30 - Juliana</td>
                <td className="px-4 py-3 font-bold text-emerald-600">+R$ 320</td>
                <td className="px-4 py-3 text-slate-500">settled</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-950">commission</td>
                <td className="px-4 py-3 text-slate-500">Bruno Silva - semana 11</td>
                <td className="px-4 py-3 font-bold text-rose-600">-R$ 142</td>
                <td className="px-4 py-3 text-slate-500">pending</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-950">adjustment</td>
                <td className="px-4 py-3 text-slate-500">Estorno parcial</td>
                <td className="px-4 py-3 font-bold text-slate-950">-R$ 40</td>
                <td className="px-4 py-3 text-slate-500">settled</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
