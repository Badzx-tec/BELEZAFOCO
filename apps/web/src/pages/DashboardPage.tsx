import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, EmptyState, SectionTag, SkeletonBlock } from "../components/ui";
import { formatCurrency, formatDateTime } from "../lib/format";
import { useAuth } from "../lib/auth";

type DashboardSummary = {
  today: {
    appointments: number;
    confirmed: number;
    pendingPayment: number;
    occupancyRate: number;
  };
  funnel: {
    cancelled: number;
    noShows: number;
    newClients: number;
    recurringClients: number;
  };
  revenue: {
    predicted: number;
    confirmed: number;
  };
  upcoming: Array<{
    id: string;
    startAt: string;
    status: string;
    clientName: string;
    serviceName: string;
    staffName: string;
  }>;
  topServices: Array<{
    serviceId: string;
    name: string;
    count: number;
  }>;
  topStaff: Array<{
    staffMemberId: string;
    name: string;
    count: number;
  }>;
};

function statusToneFor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("pending")) return "warning" as const;
  if (normalized.includes("cancel")) return "danger" as const;
  if (normalized.includes("done")) return "success" as const;
  return "accent" as const;
}

function LoadingDashboard() {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="px-5 py-5">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-5 h-12 w-24" />
            <SkeletonBlock className="mt-5 h-px w-full rounded-none" />
            <SkeletonBlock className="mt-4 h-4 w-40" />
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="px-6 py-6">
          <SkeletonBlock className="h-6 w-44" />
          <SkeletonBlock className="mt-4 h-10 w-2/3" />
          <SkeletonBlock className="mt-3 h-4 w-5/6" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-28 w-full" />
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="px-6 py-6">
            <SkeletonBlock className="h-5 w-36" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-24 w-full" />
              ))}
            </div>
          </Card>
          <Card className="px-6 py-6">
            <SkeletonBlock className="h-5 w-32" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-20 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

export function DashboardPage() {
  const { user, activeWorkspace, authorizedApi, logout } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      setLoading(true);
      setError(null);

      try {
        const payload = await authorizedApi<DashboardSummary>("/me/dashboard/summary");
        if (!cancelled) {
          setSummary(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o painel");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSummary();
    return () => {
      cancelled = true;
    };
  }, [authorizedApi, activeWorkspace?.id]);

  return (
    <AppShell
      title={activeWorkspace ? `Painel de ${activeWorkspace.name}` : "Painel operacional"}
      subtitle="Agenda, ocupacao, receita e clientes carregados do workspace autenticado em tempo real."
      workspaceName={activeWorkspace?.name ?? "Workspace"}
      workspaceSlug={activeWorkspace?.slug}
      userName={user?.name}
      onLogout={() => void logout()}
    >
      {loading ? <LoadingDashboard /> : null}

      {!loading && error ? (
        <Card className="px-6 py-8">
          <EmptyState
            title="Nao foi possivel carregar o painel"
            description={error}
            action={
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            }
          />
        </Card>
      ) : null}

      {!loading && !error && summary ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Atendimentos hoje",
                value: String(summary.today.appointments),
                note: `${summary.today.confirmed} confirmados e ${summary.today.pendingPayment} aguardando sinal`
              },
              {
                label: "Ocupacao",
                value: `${summary.today.occupancyRate}%`,
                note: "Leitura da agenda do dia considerando horas configuradas"
              },
              {
                label: "Receita prevista",
                value: formatCurrency(summary.revenue.predicted),
                note: "Soma dos servicos agendados no periodo atual"
              },
              {
                label: "Receita confirmada",
                value: formatCurrency(summary.revenue.confirmed),
                note: `${summary.funnel.newClients} novos clientes e ${summary.funnel.recurringClients} recorrentes neste mes`
              }
            ].map((item, index) => (
              <Card key={item.label} className="interactive-lift overflow-hidden px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className="mt-4 text-4xl font-semibold text-slate-950">{item.value}</p>
                  </div>
                  <span className={`rounded-2xl px-3 py-2 text-xs font-semibold ${index >= 2 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                    {index === 0 ? "Operacao" : index === 1 ? "Capacidade" : index === 2 ? "Previsto" : "Confirmado"}
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
                    O que a operacao precisa enxergar agora.
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                    Lista real dos proximos atendimentos com status, cliente e profissional a partir do workspace autenticado.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success">{summary.today.confirmed} confirmados</Badge>
                  <Badge tone="warning">{summary.today.pendingPayment} aguardando sinal</Badge>
                  <Badge tone="danger">{summary.funnel.cancelled} cancelamentos</Badge>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {summary.upcoming.length ? (
                  summary.upcoming.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-4 rounded-[28px] border border-slate-200/75 bg-white/86 px-4 py-4 transition hover:border-slate-300 md:grid-cols-[140px_1fr_auto] md:items-center"
                    >
                      <div className="rounded-[22px] bg-slate-950 px-4 py-3 text-white">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/60">Horario</p>
                        <p className="mt-2 text-sm font-semibold leading-6">{formatDateTime(item.startAt)}</p>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-slate-950">{item.clientName}</p>
                          <Badge tone={statusToneFor(item.status)}>{item.status}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {item.serviceName} com {item.staffName}
                        </p>
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
                  ))
                ) : (
                  <EmptyState
                    title="Nenhum atendimento futuro encontrado"
                    description="Assim que houver reservas confirmadas neste workspace, a agenda operacional aparece aqui."
                  />
                )}
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="px-6 py-6">
                <SectionTag>Radar comercial</SectionTag>
                <div className="mt-5 space-y-3">
                  {[
                    {
                      title: "Novos clientes no mes",
                      detail: `${summary.funnel.newClients} cadastros recentes com potencial de recorrencia`,
                      tone: "success" as const
                    },
                    {
                      title: "Clientes recorrentes",
                      detail: `${summary.funnel.recurringClients} clientes com duas ou mais visitas registradas`,
                      tone: "accent" as const
                    },
                    {
                      title: "No-shows e cancelamentos",
                      detail: `${summary.funnel.noShows} faltas e ${summary.funnel.cancelled} cancelamentos no periodo`,
                      tone: "warning" as const
                    }
                  ].map((item) => (
                    <div key={item.title} className="rounded-[24px] border border-slate-200/70 bg-white/80 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <Badge tone={item.tone}>{item.tone === "success" ? "ok" : item.tone === "warning" ? "alerta" : "insight"}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="px-6 py-6">
                <SectionTag>Equipe mais ativa</SectionTag>
                <div className="mt-5 space-y-3">
                  {summary.topStaff.length ? (
                    summary.topStaff.map((item) => (
                      <div key={item.staffMemberId} className="rounded-[24px] bg-slate-50/90 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-base font-semibold text-slate-900">{item.name}</p>
                          <Badge tone="accent">{item.count} atendimentos</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">Volume consolidado no periodo atual.</p>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Sem equipe ranqueada ainda"
                      description="Quando os atendimentos entrarem, o ranking operacional aparece aqui."
                    />
                  )}
                </div>
              </Card>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <Card className="px-6 py-6">
              <SectionTag>Servicos com mais saida</SectionTag>
              <div className="mt-5 space-y-5">
                {summary.topServices.length ? (
                  summary.topServices.map((item, index) => (
                    <div key={item.serviceId}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-slate-900">{item.name}</span>
                        <span className="text-slate-500">{item.count} reservas</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-950"
                          style={{ width: `${Math.max(20, 100 - index * 18)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="Sem servicos ranqueados ainda"
                    description="O ranking aparece assim que o workspace receber agendamentos reais."
                  />
                )}
              </div>
            </Card>

            <Card className="px-6 py-6">
              <SectionTag>Leitura do workspace</SectionTag>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] bg-white/80 px-4 py-4 soft-ring">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Slug</p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{activeWorkspace?.slug ?? "-"}</p>
                </div>
                <div className="rounded-[24px] bg-white/80 px-4 py-4 soft-ring">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Perfil</p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{activeWorkspace?.role ?? "-"}</p>
                </div>
                <div className="rounded-[24px] bg-white/80 px-4 py-4 soft-ring">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Timezone</p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{activeWorkspace?.timezone ?? "-"}</p>
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-slate-200/75 bg-white/70 px-5 py-5">
                <p className="text-sm leading-7 text-slate-500">
                  Este painel agora depende de autenticacao real e do workspace selecionado. Nada aqui usa fallback visual para sessao ou usuario.
                </p>
              </div>
            </Card>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
