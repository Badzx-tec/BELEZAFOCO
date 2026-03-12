import Image from "next/image";
import { Panel } from "@/components/app-shell";
import { agendaItems } from "@/lib/site-data";

export default function AgendaPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel title="Agenda do dia" description="Visao diaria com status, profissional, sinal e acao rapida.">
        <div className="space-y-3">
          {agendaItems.map((item) => (
            <div key={`${item.time}-${item.client}`} className="rounded-[26px] border border-slate-200/70 bg-white/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xl font-bold text-slate-950">{item.time}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{item.status}</p>
                </div>
                <span className="inline-flex rounded-full border border-[color:var(--color-accent)]/20 bg-[color:var(--color-accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">
                  {item.badge}
                </span>
              </div>
              <p className="mt-4 text-base font-bold text-slate-950">{item.client}</p>
              <p className="mt-1 text-sm text-slate-500">{item.service} - {item.staff}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Booking mobile-first" description="A mesma narrativa visual do draft de booking, agora como referencia operacional.">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/70">
          <Image src="/marketing/hero-mobile-booking.svg" alt="Preview do booking premium" fill className="object-cover" />
        </div>
      </Panel>
    </div>
  );
}
