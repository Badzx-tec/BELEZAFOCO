import { Card, Input, Textarea } from "@belezafoco/ui";
import { Panel } from "@/components/app-shell";

export default function OnboardingPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Sprint de onboarding" description="Sequencia curta para publicar o workspace sem improviso.">
        <div className="space-y-4">
          {["Branding do negocio", "Catalogo de servicos", "Equipe e disponibilidade", "WhatsApp e Pix", "Politica de booking"].map((step, index) => (
            <div key={step} className="flex items-start gap-4 rounded-[24px] border border-slate-200/70 bg-white/70 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">{index + 1}</div>
              <div>
                <p className="text-sm font-bold text-slate-950">{step}</p>
                <p className="mt-1 text-sm text-slate-500">Checklist pronto para Northflank, auth e booking publico.</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Card className="p-8">
        <h2 className="text-2xl font-bold text-slate-950">Dados do workspace</h2>
        <form className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="trade-name" className="text-sm font-semibold text-slate-700">Nome fantasia</label>
            <Input id="trade-name" placeholder="Studio Jardins" />
          </div>
          <div className="space-y-2">
            <label htmlFor="niche" className="text-sm font-semibold text-slate-700">Nicho</label>
            <Input id="niche" placeholder="Salao premium" />
          </div>
          <div className="space-y-2">
            <label htmlFor="timezone" className="text-sm font-semibold text-slate-700">Timezone</label>
            <Input id="timezone" placeholder="America/Sao_Paulo" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="booking-policy" className="text-sm font-semibold text-slate-700">Politica de booking</label>
            <Textarea id="booking-policy" placeholder="Sinal via Pix para horarios premium e tolerancia de 10 minutos." />
          </div>
          <div className="md:col-span-2">
            <button className="inline-flex h-12 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-bold text-white">Salvar onboarding</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
