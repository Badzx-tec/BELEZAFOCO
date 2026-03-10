import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, EmptyState, SectionTag } from "../components/ui";
import { demoAgenda, demoChecklist, demoKpis, demoTopServices } from "../lib/demo";

const teamLoad = [
  { name: "Joao", queue: "7 atendimentos", next: "Corte Premium as 15:15", tone: "accent" as const },
  { name: "Camila", queue: "5 atendimentos", next: "Manicure em Gel as 16:30", tone: "warning" as const },
  { name: "Bruna", queue: "6 atendimentos", next: "Limpeza Premium as 16:45", tone: "success" as const }
];

const actionFeed = [
  { title: "Lembretes 2h antes enviados", detail: "12 clientes notificados sem duplicidade", tone: "success" as const },
  { title: "2 reservas aguardando Pix", detail: "Servicos de maior disputa seguem protegidos", tone: "warning" as const },
  { title: "Checklist de implantacao em 60%", detail: "Faltam permissões e templates automatizados", tone: "accent" as const }
];

function statusToneFor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("sinal")) return "accent" as const;
  if (normalized.includes("pend")) return "warning" as const;
  return "success" as const;
}

export function DashboardPage() {
  return (
    <AppShell
      title="Studio Beleza Foco"
      subtitle="Painel operacional para recepcao, agenda e cobranca do dia, com leitura rapida e cara de software pronto para vender."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {demoKpis.map((item, index) => (
          <Card key={item.label} className="interactive-lift overflow-hidden px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-4 text-4xl font-semibold text-slate-950">{item.value}</p>
              </div>
              <span className={`rounded-2xl px-3 py-2 text-xs font-semibold ${index === 3 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                {index === 0 ? "Tempo real" : index === 1 ? "Meta semanal" : index === 2 ? "Saudavel" : "Controlado"}
              </span>
            </div>
            <div className="mt-5 hairline h-px" />
            <p className="mt-4 text-sm leading-6 text-slate-500">{item.note}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <SectionTag>Agenda do dia</SectionTag>
              <h3 className="mt-4 text-balance text-[28px] font-semibold text-slate-950">
                O que a recepcao precisa enxergar agora, sem rolagem cansativa.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Timeline clara, status forte e leitura instantanea para reagendamento, encaixe e cobranca.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">7 confirmados</Badge>
              <Badge tone="warning">3 pendentes</Badge>
              <Badge tone="accent">2 com Pix</Badge>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="soft" size="sm">
              Hoje
            </Button>
            <Button variant="ghost" size="sm">
              Semana
            </Button>
            <Button variant="ghost" size="sm">
              Filtrar por profissional
            </Button>
            <Button variant="ghost" size="sm">
              Exportar resumo
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            {demoAgenda.map((item) => (
              <div
                key={`${item.time}-${item.client}`}
                className="grid gap-4 rounded-[28px] border border-slate-200/75 bg-white/86 px-4 py-4 transition hover:border-slate-300 md:grid-cols-[104px_1fr_auto] md:items-center"
              >
                <div className="rounded-[22px] bg-slate-950 px-4 py-3 text-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">Horario</p>
                  <p className="mt-2 text-2xl font-semibold">{item.time}</p>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-950">{item.client}</p>
                    <Badge tone={statusToneFor(item.status)}>{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.service} com {item.staff}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <span>Confirmacao automatica</span>
                    <span>WhatsApp</span>
                    <span>Historico disponivel</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button variant="secondary" size="sm">
                    Reagendar
                  </Button>
                  <Button variant="soft" size="sm">
                    Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="px-6 py-6">
            <SectionTag>Radar de operacao</SectionTag>
            <div className="mt-5 space-y-3">
              {actionFeed.map((item) => (
                <div key={item.title} className="rounded-[24px] border border-slate-200/70 bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <Badge tone={item.tone}>{item.tone === "success" ? "ok" : item.tone === "warning" ? "atencao" : "insight"}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="px-6 py-6">
            <SectionTag>Equipe e fila</SectionTag>
            <div className="mt-5 space-y-3">
              {teamLoad.map((item) => (
                <div key={item.name} className="rounded-[24px] bg-slate-50/90 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-slate-900">{item.name}</p>
                    <Badge tone={item.tone}>{item.queue}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{item.next}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_0.7fr_0.7fr]">
        <Card className="px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SectionTag>Onboarding guiado</SectionTag>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">Checklist para implantar e cobrar rapido.</h3>
            </div>
            <Badge tone="accent">60%</Badge>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: "60%" }} />
          </div>
          <div className="mt-5 space-y-3">
            {demoChecklist.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-[24px] border border-slate-200/70 bg-white/75 px-4 py-4">
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
          <SectionTag>Servicos mais vendidos</SectionTag>
          <div className="mt-5 space-y-5">
            {demoTopServices.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-900">{item.name}</span>
                  <span className="text-slate-500">{item.share}% da agenda</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-950" style={{ width: `${item.share}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[24px] bg-slate-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Leitura comercial</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use esses servicos para empurrar sinal Pix e recorrencia. Eles puxam a maior parte da receita prevista.
            </p>
          </div>
        </Card>

        <Card className="px-6 py-6">
          <SectionTag>Lista de espera</SectionTag>
          <div className="mt-5">
            <EmptyState
              title="Nenhuma espera ativa no momento"
              description="Quando houver desmarcacao de ultima hora, este quadro pode priorizar clientes recorrentes e contatos quentes."
              action={
                <Button variant="secondary" size="sm">
                  Configurar reengajamento
                </Button>
              }
            />
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
