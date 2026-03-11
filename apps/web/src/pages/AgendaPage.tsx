import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, EmptyState, Field, Input, SectionTag, SkeletonBlock } from "../components/ui";
import { CalendarIcon, ClockIcon } from "../components/premium";
import { API_URL } from "../lib/api";
import { formatCurrency, formatDateTime, formatTime, readableError } from "../lib/format";
import { useAuth } from "../lib/auth";

type AppointmentItem = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  internalNotes?: string | null;
  publicNotes?: string | null;
  depositAmount?: number | null;
  service: {
    name: string;
    category: string;
    priceValue?: number | null;
    durationMinutes: number;
  };
  client: {
    name: string;
    whatsapp: string;
  };
  staffMember: {
    id: string;
    name: string;
    colorHex: string;
  };
  resource?: {
    name: string;
  } | null;
  payments: Array<{
    id: string;
    status: string;
    amount: number;
    provider: string;
  }>;
};

const todayKey = new Date().toISOString().slice(0, 10);

function statusTone(status: string) {
  if (status === "pending_payment") return "warning" as const;
  if (status === "confirmed" || status === "done") return "success" as const;
  if (status === "cancelled" || status === "late_cancel" || status === "no_show") return "danger" as const;
  return "neutral" as const;
}

function statusLabel(status: string) {
  switch (status) {
    case "pending_payment":
      return "Aguardando Pix";
    case "confirmed":
      return "Confirmado";
    case "done":
      return "Concluido";
    case "cancelled":
      return "Cancelado";
    case "late_cancel":
      return "Late cancel";
    case "no_show":
      return "No-show";
    case "rescheduled":
      return "Reagendado";
    default:
      return "Solicitado";
  }
}

export function AgendaPage() {
  const { user, activeWorkspace, authorizedApi, logout, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [filters, setFilters] = useState({
    from: todayKey,
    to: todayKey,
    status: "all"
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadAgenda() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set("from", `${filters.from}T00:00:00.000Z`);
      if (filters.to) params.set("to", `${filters.to}T23:59:59.999Z`);
      if (filters.status !== "all") params.set("status", filters.status);
      const payload = await authorizedApi<AppointmentItem[]>(`/me/appointments?${params.toString()}`);
      setAppointments(payload);
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAgenda();
  }, [filters.from, filters.to, filters.status, activeWorkspace?.id]);

  const summary = useMemo(() => {
    const totalRevenue = appointments.reduce((total, item) => total + (item.service.priceValue ?? item.depositAmount ?? 0), 0);
    return {
      total: appointments.length,
      pendingPayment: appointments.filter((item) => item.status === "pending_payment").length,
      confirmed: appointments.filter((item) => item.status === "confirmed").length,
      noShow: appointments.filter((item) => item.status === "no_show").length,
      totalRevenue
    };
  }, [appointments]);

  async function updateStatus(appointmentId: string, status: "confirmed" | "done" | "cancelled" | "no_show") {
    setUpdatingId(appointmentId);
    setError(null);
    setNotice(null);
    try {
      await authorizedApi(`/me/appointments/${appointmentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status
        })
      });
      setNotice(`Agendamento atualizado para ${statusLabel(status)}.`);
      await loadAgenda();
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setUpdatingId(null);
    }
  }

  async function exportCsv() {
    if (!accessToken) return;
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    const response = await fetch(`${API_URL}/me/appointments/export.csv?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(activeWorkspace ? { "x-workspace-id": activeWorkspace.id } : {})
      }
    });

    if (!response.ok) {
      setError("Nao foi possivel exportar a agenda.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `agenda-${activeWorkspace?.slug ?? "workspace"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      activeSection="agenda"
      title={activeWorkspace ? `Agenda premium de ${activeWorkspace.name}` : "Agenda premium"}
      subtitle="Fila do dia, status do Pix e operacao da recepcao conectados aos agendamentos reais."
      workspaceName={activeWorkspace?.name ?? "Workspace"}
      workspaceSlug={activeWorkspace?.slug}
      userName={user?.name}
      onLogout={() => void logout()}
    >
      {loading ? (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <SkeletonBlock className="h-[520px]" />
          <SkeletonBlock className="h-[520px]" />
        </section>
      ) : null}

      {!loading && error ? (
        <Card className="px-6 py-8">
          <EmptyState title="Nao foi possivel carregar a agenda" description={error} action={<Button onClick={() => void loadAgenda()}>Tentar novamente</Button>} />
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          {notice ? <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">{notice}</div> : null}

          <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <Card className="surface-dark overflow-hidden px-6 py-6 text-white sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionTag className="border-white/10 bg-white/10 text-white/80">Agenda editorial</SectionTag>
                  <h2 className="mt-4 text-3xl font-semibold text-white">Recepcao, equipe e sinal no mesmo cockpit.</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                    O recorte operacional mostra quem entra hoje, quem ainda nao garantiu o horario e onde a recepcao precisa agir.
                  </p>
                </div>
                <CalendarIcon className="h-6 w-6 text-white/72" />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Atendimentos" value={String(summary.total)} />
                <MetricCard label="Aguardando Pix" value={String(summary.pendingPayment)} />
                <MetricCard label="Confirmados" value={String(summary.confirmed)} />
                <MetricCard label="Receita estimada" value={formatCurrency(summary.totalRevenue)} />
              </div>

              <div className="mt-6 rounded-[28px] border border-white/10 bg-white/6 p-5">
                <img alt="Visao premium da agenda" className="h-[220px] w-full rounded-[22px] object-cover" src="/demo/agenda-board.svg" />
              </div>
            </Card>

            <Card className="px-6 py-6 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionTag>Filtros operacionais</SectionTag>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">Recorte da agenda</h2>
                </div>
                <ClockIcon className="h-6 w-6 text-slate-500" />
              </div>

              <div className="mt-6 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="De">
                    <Input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
                  </Field>
                  <Field label="Ate">
                    <Input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
                  </Field>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["all", "Tudo"],
                    ["pending_payment", "Aguardando Pix"],
                    ["confirmed", "Confirmados"],
                    ["done", "Concluidos"],
                    ["cancelled", "Cancelados"],
                    ["no_show", "No-show"]
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilters((current) => ({ ...current, status: value }))}
                      className={`rounded-[20px] border px-4 py-3 text-left text-sm font-semibold transition ${
                        filters.status === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-950">No-show no recorte</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{summary.noShow}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void loadAgenda()}>Atualizar agenda</Button>
                  <Button variant="secondary" onClick={() => void exportCsv()}>
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid gap-4">
            {appointments.length ? (
              appointments.map((appointment) => (
                <Card key={appointment.id} className="px-6 py-6 sm:px-8">
                  <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
                    <div className="flex items-start gap-4">
                      <span
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] text-sm font-semibold text-white"
                        style={{ backgroundColor: appointment.staffMember.colorHex }}
                      >
                        {appointment.staffMember.name
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xl font-semibold text-slate-950">{appointment.client.name}</p>
                          <Badge tone={statusTone(appointment.status)}>{statusLabel(appointment.status)}</Badge>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-500">
                          {appointment.service.name} | {appointment.staffMember.name} | {formatDateTime(appointment.startAt)}
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <InfoCard label="Horario" value={`${formatTime(appointment.startAt)} - ${formatTime(appointment.endAt)}`} />
                          <InfoCard label="Servico" value={formatCurrency(appointment.service.priceValue ?? appointment.depositAmount)} />
                          <InfoCard label="Contato" value={appointment.client.whatsapp} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Operacao do card</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          {appointment.resource?.name
                            ? `Recurso reservado: ${appointment.resource.name}.`
                            : "Sem recurso compartilhado vinculado a este atendimento."}
                        </p>
                        {appointment.publicNotes || appointment.internalNotes ? (
                          <p className="mt-3 text-sm leading-7 text-slate-600">Observacao: {appointment.internalNotes ?? appointment.publicNotes}</p>
                        ) : null}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button busy={updatingId === appointment.id} variant="secondary" onClick={() => void updateStatus(appointment.id, "confirmed")}>
                          Confirmar
                        </Button>
                        <Button busy={updatingId === appointment.id} variant="secondary" onClick={() => void updateStatus(appointment.id, "done")}>
                          Concluir
                        </Button>
                        <Button busy={updatingId === appointment.id} variant="secondary" onClick={() => void updateStatus(appointment.id, "cancelled")}>
                          Cancelar
                        </Button>
                        <Button busy={updatingId === appointment.id} variant="secondary" onClick={() => void updateStatus(appointment.id, "no_show")}>
                          No-show
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="px-6 py-8">
                <EmptyState
                  title="Nenhum agendamento no recorte"
                  description="Ajuste as datas ou use o link publico para comecar a encher a agenda com dados reais."
                  action={<Button onClick={() => setFilters({ from: todayKey, to: todayKey, status: "all" })}>Voltar para hoje</Button>}
                />
              </Card>
            )}
          </section>
        </>
      ) : null}
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/8 px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/48">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white/80 px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
