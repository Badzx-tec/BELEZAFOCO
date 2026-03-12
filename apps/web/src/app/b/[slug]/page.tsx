import Image from "next/image";
import { Card, Input } from "@belezafoco/ui";

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className="page-shell grid gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-[16/9] border-b border-slate-200/60">
          <Image src="/marketing/booking-cover.svg" alt="Booking publico premium" fill className="object-cover" />
        </div>
        <div className="p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--color-accent)]">Booking publico</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Studio {slug.replace(/-/g, " ")}</h1>
          <p className="mt-4 text-base leading-8 text-slate-500">
            Fluxo mobile-first com selecao de servico, profissional, horario, sinal via Pix e confirmacao por WhatsApp.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {["Corte premium", "Design de sobrancelha", "Manicure spa"].map((service) => (
              <div key={service} className="rounded-[24px] border border-slate-200/70 bg-white/70 p-4">
                <p className="text-sm font-bold text-slate-950">{service}</p>
                <p className="mt-2 text-sm text-slate-500">60 min - sinal opcional</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-8">
        <h2 className="text-3xl font-bold text-slate-950">Finalize sua reserva</h2>
        <form className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="client-name" className="text-sm font-semibold text-slate-700">Nome</label>
            <Input id="client-name" placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <label htmlFor="client-phone" className="text-sm font-semibold text-slate-700">WhatsApp</label>
            <Input id="client-phone" placeholder="(11) 99999-9999" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="service" className="text-sm font-semibold text-slate-700">Servico</label>
              <Input id="service" placeholder="Corte premium" />
            </div>
            <div className="space-y-2">
              <label htmlFor="professional" className="text-sm font-semibold text-slate-700">Profissional</label>
              <Input id="professional" placeholder="Bruno Silva" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-semibold text-slate-700">Data</label>
              <Input id="date" placeholder="15/03/2026" />
            </div>
            <div className="space-y-2">
              <label htmlFor="time" className="text-sm font-semibold text-slate-700">Horario</label>
              <Input id="time" placeholder="15:15" />
            </div>
          </div>
          <button className="inline-flex h-12 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-bold text-white">
            Reservar e gerar Pix
          </button>
        </form>
      </Card>
    </div>
  );
}
