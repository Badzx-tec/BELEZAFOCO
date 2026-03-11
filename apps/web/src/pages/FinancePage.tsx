import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Badge, Button, Card, EmptyState, Field, Input, SectionTag, SkeletonBlock, Textarea } from "../components/ui";
import { ChartIcon, ShieldIcon, SparkIcon, UsersIcon, WalletIcon } from "../components/premium";
import { API_URL } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatCurrency, formatDateTime, readableError } from "../lib/format";

type FinanceEntry = {
  id: string;
  title: string;
  direction: "inflow" | "outflow";
  kind: string;
  status: "pending" | "paid" | "cancelled" | "overdue";
  amountCents: number;
  occurredAt: string;
  paidAt: string | null;
  category: { id: string; name: string; direction: "inflow" | "outflow"; colorHex: string } | null;
  costCenter: { id: string; name: string } | null;
  staffMember: { id: string; name: string; colorHex: string } | null;
  appointment: { id: string; status: string; startAt: string; clientName: string | null; serviceName: string | null } | null;
};

type FinanceDashboard = {
  summary: {
    receivedCents: number;
    pendingReceivablesCents: number;
    paidOutflowCents: number;
    scheduledOutflowCents: number;
    projectedNetCents: number;
    overdueCount: number;
  };
  spotlight: {
    monthLabel: string;
    nextClosureAt: string | null;
  };
  recentEntries: FinanceEntry[];
  categoryBreakdown: Array<{
    id: string;
    name: string;
    direction: "inflow" | "outflow";
    amountCents: number;
    colorHex: string;
  }>;
  staffPerformance: Array<{
    id: string;
    name: string;
    colorHex: string;
    revenueCents: number;
    appointments: number;
    projectedCommissionCents: number;
  }>;
  trend: Array<{
    month: string;
    inflowCents: number;
    outflowCents: number;
  }>;
  closures: Array<{
    id: string;
    openedAt: string;
    closedAt: string;
    inflowCents: number;
    outflowCents: number;
    expectedBalanceCents: number;
    actualBalanceCents: number | null;
    notes: string | null;
    closedByUser: { id: string; name: string } | null;
  }>;
  catalog: {
    categories: Array<{ id: string; name: string; direction: "inflow" | "outflow"; colorHex: string }>;
    costCenters: Array<{ id: string; name: string }>;
  };
};

type FinanceEntriesResponse = {
  catalog: FinanceDashboard["catalog"];
  entries: FinanceEntry[];
};

type CommissionsSummary = {
  totals: {
    appointments: number;
    revenueCents: number;
    projectedCommissionCents: number;
  };
  staff: Array<{
    id: string;
    name: string;
    colorHex: string;
    appointments: number;
    revenueCents: number;
    commissionPercent: number;
    projectedCommissionCents: number;
  }>;
};

function entryTone(entry: FinanceEntry) {
  if (entry.status === "paid") return "success" as const;
  if (entry.status === "overdue") return "danger" as const;
  if (entry.status === "cancelled") return "neutral" as const;
  return "warning" as const;
}

function humanStatus(status: FinanceEntry["status"]) {
  switch (status) {
    case "paid":
      return "Pago";
    case "cancelled":
      return "Cancelado";
    case "overdue":
      return "Em atraso";
    default:
      return "Pendente";
  }
}

function toCents(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

const nowIso = new Date().toISOString().slice(0, 16);

export function FinancePage() {
  const { user, activeWorkspace, authorizedApi, logout, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [commissions, setCommissions] = useState<CommissionsSummary | null>(null);
  const [entryForm, setEntryForm] = useState({
    title: "",
    description: "",
    direction: "inflow" as "inflow" | "outflow",
    kind: "manual_receivable" as "manual_receivable" | "manual_expense" | "commission" | "adjustment" | "payout",
    amount: "120",
    occurredAt: nowIso,
    dueDate: "",
    categoryId: "",
    costCenterId: ""
  });
  const [closureForm, setClosureForm] = useState({
    openedAt: new Date(new Date().setHours(8, 0, 0, 0)).toISOString().slice(0, 16),
    closedAt: new Date().toISOString().slice(0, 16),
    actualBalance: "",
    notes: ""
  });
  const [entryActionId, setEntryActionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadFinance() {
    setLoading(true);
    setError(null);
    try {
      const [dashboardPayload, entriesPayload, commissionsPayload] = await Promise.all([
        authorizedApi<FinanceDashboard>("/me/finance/dashboard"),
        authorizedApi<FinanceEntriesResponse>("/me/finance/entries"),
        authorizedApi<CommissionsSummary>("/me/finance/commissions")
      ]);
      setDashboard(dashboardPayload);
      setEntries(entriesPayload.entries);
      setCommissions(commissionsPayload);
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFinance();
  }, [authorizedApi, activeWorkspace?.id]);

  const selectableCategories = useMemo(
    () => dashboard?.catalog.categories.filter((item) => item.direction === entryForm.direction) ?? [],
    [dashboard?.catalog.categories, entryForm.direction]
  );

  async function createEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await authorizedApi("/me/finance/entries", {
        method: "POST",
        body: JSON.stringify({
          title: entryForm.title,
          description: entryForm.description || undefined,
          direction: entryForm.direction,
          kind: entryForm.kind,
          amountCents: toCents(entryForm.amount),
          occurredAt: new Date(entryForm.occurredAt).toISOString(),
          dueDate: entryForm.dueDate ? new Date(entryForm.dueDate).toISOString() : undefined,
          categoryId: entryForm.categoryId || undefined,
          costCenterId: entryForm.costCenterId || undefined
        })
      });
      setNotice("Lancamento criado no ledger do workspace.");
      setEntryForm({
        title: "",
        description: "",
        direction: "inflow",
        kind: "manual_receivable",
        amount: "120",
        occurredAt: nowIso,
        dueDate: "",
        categoryId: "",
        costCenterId: ""
      });
      await loadFinance();
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setSaving(false);
    }
  }

  async function createClosure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await authorizedApi("/me/finance/cash-closures", {
        method: "POST",
        body: JSON.stringify({
          openedAt: new Date(closureForm.openedAt).toISOString(),
          closedAt: new Date(closureForm.closedAt).toISOString(),
          actualBalanceCents: closureForm.actualBalance ? toCents(closureForm.actualBalance) : undefined,
          notes: closureForm.notes || undefined
        })
      });
      setNotice("Fechamento de caixa registrado.");
      await loadFinance();
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setSaving(false);
    }
  }

  async function updateEntryStatus(entryId: string, status: "paid" | "cancelled") {
    setEntryActionId(entryId);
    setError(null);
    setNotice(null);
    try {
      await authorizedApi(`/me/finance/entries/${entryId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status
        })
      });
      setNotice(`Lancamento marcado como ${humanStatus(status)}.`);
      await loadFinance();
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setEntryActionId(null);
    }
  }

  async function exportCsv() {
    if (!accessToken) return;
    const response = await fetch(`${API_URL}/me/finance/export.csv`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(activeWorkspace ? { "x-workspace-id": activeWorkspace.id } : {})
      }
    });

    if (!response.ok) {
      setError("Nao foi possivel exportar o financeiro.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `financeiro-${activeWorkspace?.slug ?? "workspace"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      activeSection="finance"
      title={activeWorkspace ? `Financeiro de ${activeWorkspace.name}` : "Financeiro"}
      subtitle="Ledger auditavel, comissao projetada e fechamento de caixa em uma operacao financeira unica."
      workspaceName={activeWorkspace?.name ?? "Workspace"}
      workspaceSlug={activeWorkspace?.slug}
      userName={user?.name}
      onLogout={() => void logout()}
    >
      {loading ? (
        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <SkeletonBlock className="h-[520px]" />
          <SkeletonBlock className="h-[520px]" />
        </section>
      ) : null}

      {!loading && error ? (
        <Card className="px-6 py-8">
          <EmptyState title="Nao foi possivel carregar o financeiro" description={error} action={<Button onClick={() => void loadFinance()}>Tentar novamente</Button>} />
        </Card>
      ) : null}

      {!loading && !error && dashboard ? (
        <>
          {notice ? <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">{notice}</div> : null}

          <section className="grid gap-6 xl:grid-cols-[1.03fr_0.97fr]">
            <Card className="surface-dark overflow-hidden px-6 py-6 text-white sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionTag className="border-white/10 bg-white/10 text-white/80">Ledger premium</SectionTag>
                  <h2 className="mt-4 text-3xl font-semibold text-white">Recebido, previsto e fechamento no mesmo plano de voo.</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                    O cockpit financeiro cruza agenda, Pix e entradas manuais para dar previsibilidade sem planilha paralela.
                  </p>
                </div>
                <WalletIcon className="h-6 w-6 text-white/72" />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Recebido" value={formatCurrency(dashboard.summary.receivedCents)} />
                <MetricCard label="A receber" value={formatCurrency(dashboard.summary.pendingReceivablesCents)} />
                <MetricCard label="Saidas pagas" value={formatCurrency(dashboard.summary.paidOutflowCents)} />
                <MetricCard label="Saldo projetado" value={formatCurrency(dashboard.summary.projectedNetCents)} />
              </div>

              <div className="mt-6 rounded-[28px] border border-white/10 bg-white/6 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/48">Mes corrente</p>
                    <p className="mt-2 text-xl font-semibold text-white">{dashboard.spotlight.monthLabel}</p>
                  </div>
                  <Badge tone="warning" className="bg-amber-400/14 text-amber-100 ring-amber-300/20">
                    {dashboard.summary.overdueCount} em atraso
                  </Badge>
                </div>
                <img alt="Cockpit financeiro" className="mt-5 h-[220px] w-full rounded-[22px] object-cover" src="/finance/ledger-orbit.svg" />
              </div>
            </Card>

            <Card className="px-6 py-6 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionTag>Visoes executivas</SectionTag>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">Resumo comercial e operacional</h2>
                </div>
                <ChartIcon className="h-6 w-6 text-slate-500" />
              </div>

              <div className="mt-6 grid gap-3">
                {dashboard.categoryBreakdown.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: item.colorHex }} />
                        <p className="font-semibold text-slate-950">{item.name}</p>
                      </div>
                      <Badge tone={item.amountCents >= 0 ? "success" : "danger"}>{formatCurrency(Math.abs(item.amountCents))}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-sm font-semibold text-slate-950">Ultimo fechamento</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {dashboard.closures[0]
                    ? `${formatDateTime(dashboard.closures[0].closedAt)} por ${dashboard.closures[0].closedByUser?.name ?? "usuario interno"}`
                    : "Nenhum fechamento ainda. Use o formulario abaixo para registrar o primeiro caixa."}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => void exportCsv()}>Exportar CSV</Button>
                <Button variant="secondary" onClick={() => void loadFinance()}>
                  Atualizar financeiro
                </Button>
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
            <Card className="px-6 py-6 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionTag>Lancamentos</SectionTag>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">Fluxo vivo do ledger</h2>
                </div>
                <SparkIcon className="h-6 w-6 text-slate-500" />
              </div>

              <div className="mt-5 space-y-3">
                {entries.length ? (
                  entries.map((entry) => (
                    <div key={entry.id} className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold text-slate-950">{entry.title}</p>
                            <Badge tone={entryTone(entry)}>{humanStatus(entry.status)}</Badge>
                            <Badge tone={entry.direction === "inflow" ? "success" : "danger"}>{entry.direction === "inflow" ? "Entrada" : "Saida"}</Badge>
                          </div>
                          <p className="mt-2 text-sm leading-7 text-slate-500">
                            {entry.category?.name ?? "Sem categoria"} | {entry.costCenter?.name ?? "Sem centro de custo"} | {formatDateTime(entry.occurredAt)}
                          </p>
                          {entry.appointment ? (
                            <p className="mt-2 text-sm leading-7 text-slate-500">Origem: {entry.appointment.serviceName} para {entry.appointment.clientName}</p>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-3 xl:items-end">
                          <p className="text-2xl font-semibold text-slate-950">{formatCurrency(entry.amountCents)}</p>
                          {entry.status !== "paid" ? (
                            <div className="flex flex-wrap gap-2">
                              <Button busy={entryActionId === entry.id} variant="secondary" onClick={() => void updateEntryStatus(entry.id, "paid")}>
                                Marcar pago
                              </Button>
                              <Button busy={entryActionId === entry.id} variant="secondary" onClick={() => void updateEntryStatus(entry.id, "cancelled")}>
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Badge tone="success">Pago em {entry.paidAt ? formatDateTime(entry.paidAt) : "data interna"}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Ledger vazio" description="Os primeiros lancamentos aparecem aqui assim que agenda, Pix ou despesas manuais entrarem no workspace." />
                )}
              </div>
            </Card>

            <div className="space-y-6">
              <form onSubmit={createEntry}>
                <Card className="px-6 py-6 sm:px-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <SectionTag>Lancamento manual</SectionTag>
                      <h2 className="mt-4 text-2xl font-semibold text-slate-950">Adicionar entrada ou saida</h2>
                    </div>
                    <ShieldIcon className="h-6 w-6 text-slate-500" />
                  </div>

                  <div className="mt-6 grid gap-4">
                    <Field label="Titulo">
                      <Input value={entryForm.title} onChange={(event) => setEntryForm((current) => ({ ...current, title: event.target.value }))} />
                    </Field>
                    <Field label="Descricao">
                      <Textarea value={entryForm.description} onChange={(event) => setEntryForm((current) => ({ ...current, description: event.target.value }))} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Direcao">
                        <select
                          className="input-shell"
                          value={entryForm.direction}
                          onChange={(event) =>
                            setEntryForm((current) => ({
                              ...current,
                              direction: event.target.value as "inflow" | "outflow",
                              categoryId: ""
                            }))
                          }
                        >
                          <option value="inflow">Entrada</option>
                          <option value="outflow">Saida</option>
                        </select>
                      </Field>
                      <Field label="Tipo">
                        <select className="input-shell" value={entryForm.kind} onChange={(event) => setEntryForm((current) => ({ ...current, kind: event.target.value as typeof current.kind }))}>
                          <option value="manual_receivable">Recebimento avulso</option>
                          <option value="manual_expense">Despesa</option>
                          <option value="commission">Comissao</option>
                          <option value="adjustment">Ajuste</option>
                          <option value="payout">Repasse</option>
                        </select>
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Valor (R$)">
                        <Input value={entryForm.amount} onChange={(event) => setEntryForm((current) => ({ ...current, amount: event.target.value }))} />
                      </Field>
                      <Field label="Data da ocorrencia">
                        <Input type="datetime-local" value={entryForm.occurredAt} onChange={(event) => setEntryForm((current) => ({ ...current, occurredAt: event.target.value }))} />
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Categoria">
                        <select className="input-shell" value={entryForm.categoryId} onChange={(event) => setEntryForm((current) => ({ ...current, categoryId: event.target.value }))}>
                          <option value="">Categoria automatica</option>
                          {selectableCategories.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Centro de custo">
                        <select className="input-shell" value={entryForm.costCenterId} onChange={(event) => setEntryForm((current) => ({ ...current, costCenterId: event.target.value }))}>
                          <option value="">Centro padrao</option>
                          {dashboard.catalog.costCenters.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button type="submit" busy={saving}>
                      Criar lancamento
                    </Button>
                  </div>
                </Card>
              </form>

              <form onSubmit={createClosure}>
                <Card className="px-6 py-6 sm:px-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <SectionTag>Fechamento de caixa</SectionTag>
                      <h2 className="mt-4 text-2xl font-semibold text-slate-950">Registrar fechamento</h2>
                    </div>
                    <UsersIcon className="h-6 w-6 text-slate-500" />
                  </div>
                  <div className="mt-6 grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Abertura">
                        <Input type="datetime-local" value={closureForm.openedAt} onChange={(event) => setClosureForm((current) => ({ ...current, openedAt: event.target.value }))} />
                      </Field>
                      <Field label="Fechamento">
                        <Input type="datetime-local" value={closureForm.closedAt} onChange={(event) => setClosureForm((current) => ({ ...current, closedAt: event.target.value }))} />
                      </Field>
                    </div>
                    <Field label="Saldo contado (R$)">
                      <Input value={closureForm.actualBalance} onChange={(event) => setClosureForm((current) => ({ ...current, actualBalance: event.target.value }))} />
                    </Field>
                    <Field label="Observacoes">
                      <Textarea value={closureForm.notes} onChange={(event) => setClosureForm((current) => ({ ...current, notes: event.target.value }))} />
                    </Field>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button type="submit" busy={saving}>
                      Registrar fechamento
                    </Button>
                    {dashboard.spotlight.nextClosureAt ? <Badge tone="neutral">Ultimo: {formatDateTime(dashboard.spotlight.nextClosureAt)}</Badge> : null}
                  </div>
                </Card>
              </form>

              {commissions ? (
                <Card className="px-6 py-6 sm:px-8">
                  <SectionTag>Comissoes projetadas</SectionTag>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">Equipe e receita prevista</h2>
                  <div className="mt-5 space-y-3">
                    {commissions.staff.map((item) => (
                      <div key={item.id} className="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: item.colorHex }} />
                            <div>
                              <p className="font-semibold text-slate-950">{item.name}</p>
                              <p className="mt-1 text-sm text-slate-500">{item.appointments} atendimentos | {item.commissionPercent}%</p>
                            </div>
                          </div>
                          <Badge tone="accent">{formatCurrency(item.projectedCommissionCents)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
            </div>
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
