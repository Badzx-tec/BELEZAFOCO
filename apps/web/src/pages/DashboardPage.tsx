import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, EmptyState, SectionTag, SkeletonBlock } from "../components/ui";
import { CalendarIcon, ChartIcon, PremiumMetricCard, ShieldIcon, UsersIcon, WalletIcon } from "../components/premium";
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

function staffAvatar(name: string) {
  return name.charCodeAt(0) % 2 === 0
    ? "/professionals-placeholders/artist-amber.svg"
    : "/professionals-placeholders/artist-graphite.svg";
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
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SkeletonBlock className="h-[520px]" />
        <SkeletonBlock className="h-[520px]" />
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <SkeletonBlock className="h-[320px]" />
        <SkeletonBlock className="h-[320px]" />
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
        if (!cancelled) setSummary(payload);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o painel");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSummary();
    return () => {
      cancelled = true;
    };
  }, [authorizedApi, activeWorkspace?.id]);

  return (
    <AppShell
      title={activeWorkspace ? `Centro de operacoes de ${activeWorkspace.name}` : "Centro de operacoes"}
      subtitle="Agenda, ocupacao, receita e comportamento do workspace autenticado em uma leitura mais executiva e mais limpa."
      workspaceName={activeWorkspace?.name ?? "Workspace"}
      workspaceSlug={activeWorkspace?.slug}
      userName={user?.name}
      onLogout={() => void logout()}
    >
      {loading ? <LoadingDashboard /> : null}

      {!loading && error ? (
        <Card className="px-6 py-8">
          <EmptyState title="Nao foi possivel carregar o painel" description={error} action={<Button onClick={() => window.location.reload()}>Tentar novamente</Button>} />
        </Card>
      ) : null}

      {!loading && !error && summary ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PremiumMetricCard
              label="Atendimentos"
              value={String(summary.today.appointments)}
              detail={`${summary.today.confirmed} confirmados e ${summary.today.pendingPayment} aguardando sinal`}
              icon={<CalendarIcon className="h-5 w-5" />}
            />
            <PremiumMetricCard
              label="Ocupacao"
              value={`${summary.today.occupancyRate}%`}
              detail="Leitura da agenda do dia considerando horas configuradas."
              icon={<ChartIcon className="h-5 w-5" />}
            />
            <PremiumMetricCard
              label="Receita prevista"
              value={formatCurrency(summary.revenue.predicted)}
              detail="Soma dos servicos agendados no periodo atual."
              icon={<WalletIcon className="h-5 w-5" />}
            />
            <PremiumMetricCard
              label="Confirmado"
              value={formatCurrency(summary.revenue.confirmed)}
              detail={`${summary.funnel.newClients} novos clientes e ${summary.funnel.recurringClients} recorrentes no periodo.`}
              icon={<ShieldIcon className="h-5 w-5" />}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <Card className="overflow-hidden px-6 py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <SectionTag>Agenda operacional</SectionTag>
                  <h3 className="mt-4 text-balance text-[30px] font-semibold tracking-tight text-slate-950">O que a operacao precisa enxergar agora.</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">Lista real dos proximos atendimentos com status, cliente, servico e profissional.</p>
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
                    <div key={item.id} className="grid gap-4 rounded-[30px] border border-slate-200/75 bg-white/86 px-4 py-4 transition hover:border-slate-300 md:grid-cols-[128px_1fr_auto] md:items-center">
                      <div className="rounded-[24px] bg-slate-950 px-4 py-4 text-white">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/52">Horario</p>
                        <p className="mt-2 text-sm font-semibold leading-6">{formatDateTime(item.startAt)}</p>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-slate-950">{item.clientName}</p>
                          <Badge tone={statusToneFor(item.status)}>{item.status}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{item.serviceName} com {item.staffName}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button variant="secondary" size="sm">Reagendar</Button>
                        <Button variant="soft" size="sm">Detalhes</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Nenhum atendimento futuro encontrado" description="Assim que houver reservas confirmadas neste workspace, a agenda operacional aparece aqui." />
                )}
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="px-6 py-6">
                <SectionTag>Radar comercial</SectionTag>
                <div className="mt-5 space-y-3">
                  {[
                    { title: "Novos clientes", detail: `${summary.funnel.newClients} cadastros recentes com potencial de recorrencia.`, tone: "success" as const },
                    { title: "Recorrencia", detail: `${summary.funnel.recurringClients} clientes com duas ou mais visitas registradas.`, tone: "accent" as const },
                    { title: "No-show e cancelamentos", detail: `${summary.funnel.noShows} faltas e ${summary.funnel.cancelled} cancelamentos no periodo.`, tone: "warning" as const }
                  ].map((item) => (
                    <div key={item.title} className="rounded-[26px] border border-slate-200/75 bg-white/82 px-4 py-4">
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
                    summary.topStaff.map((item, index) => (
                      <div key={item.staffMemberId} className="flex items-center gap-4 rounded-[26px] border border-slate-200/75 bg-white/82 px-4 py-4">
                        <img alt={item.name} className="h-14 w-14 rounded-full object-cover" src={staffAvatar(item.name)} />
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-500">Volume consolidado no periodo atual.</p>
                        </div>
                        <Badge tone={index === 0 ? "accent" : "neutral"}>{item.count} atendimentos</Badge>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="Sem equipe ranqueada ainda" description="Quando os atendimentos entrarem, o ranking operacional aparece aqui." />
                  )}
                </div>
              </Card>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
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
                        <div className={`h-full rounded-full ${index === 0 ? "bg-slate-950" : index === 1 ? "bg-slate-700" : "bg-[var(--accent)]"}`} style={{ width: `${Math.max(20, 100 - index * 18)}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Sem servicos ranqueados ainda" description="O ranking aparece assim que o workspace receber agendamentos reais." />
                )}
              </div>
            </Card>

            <Card className="px-6 py-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <SectionTag>Leitura do workspace</SectionTag>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-950">Infra, contexto e leitura rapida do ambiente.</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <UsersIcon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] bg-white/80 px-4 py-4 soft-ring">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Slug</p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{activeWorkspace?.slug ?? "-"}</p>
                </div>
                <div className="rounded-[24px] bg-white/80 px-4 py-4 soft-ring">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Perfil</p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{activeWorkspace?.role ?? "-"}</p>
                </div>
                <div className="rounded-[24px] bg-white/80 px-4 py-4 soft-ring">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Timezone</p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{activeWorkspace?.timezone ?? "-"}</p>
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-slate-200/75 bg-white/70 px-5 py-5">
                <p className="text-sm leading-7 text-slate-500">
                  Nada aqui depende de fallback visual. O painel reflete o workspace autenticado e a operacao real da conta atual.
                </p>
              </div>
            </Card>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
