import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { CheckIcon, ShieldIcon, SparkIcon, WalletIcon } from "../components/premium";
import { Badge, Button, Card, EmptyState, SectionTag, SkeletonBlock } from "../components/ui";
import { useAuth } from "../lib/auth";
import { formatCurrency, formatDateTime, readableError } from "../lib/format";

type BillingSummary = {
  workspace: {
    name: string;
    slug: string;
    createdAt: string;
  };
  canManage: boolean;
  subscription: {
    plan: "trial" | "basic" | "pro";
    status: "trialing" | "active" | "past_due" | "cancelled";
    paidUntil: string;
    trialEndsAt: string | null;
  };
  usage: {
    staff: number;
    resources: number;
    appointmentsThisMonth: number;
  };
  limits: {
    staff: number | null;
    resources: number | null;
    appointments: number | null;
  };
  plans: Array<{
    id: "trial" | "basic" | "pro";
    label: string;
    monthlyPriceCents: number;
    description: string;
    features: string[];
    current: boolean;
    limits: {
      staff: number | null;
      resources: number | null;
      appointments: number | null;
    };
  }>;
};

function limitLabel(value: number | null, suffix: string) {
  return value === null ? `Sem limite de ${suffix}` : `${value} ${suffix}`;
}

export function BillingPage() {
  const { user, activeWorkspace, authorizedApi, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"trial" | "basic" | "pro">("basic");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [submitting, setSubmitting] = useState(false);

  async function loadPage() {
    setLoading(true);
    setError(null);
    try {
      const payload = await authorizedApi<BillingSummary>("/me/billing/summary");
      setSummary(payload);
      setSelectedPlan(payload.plans.find((plan) => !plan.current && plan.id !== "trial")?.id ?? payload.subscription.plan);
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [authorizedApi, activeWorkspace?.id]);

  const selectedPlanCard = useMemo(() => summary?.plans.find((plan) => plan.id === selectedPlan) ?? null, [selectedPlan, summary?.plans]);

  async function handleUpgradeRequest() {
    if (!selectedPlanCard || !summary?.canManage) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await authorizedApi<{ ok: true; message: string }>("/me/billing/request-upgrade", {
        method: "POST",
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod
        })
      });
      setNotice(response.message);
      await loadPage();
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      activeSection="billing"
      title={activeWorkspace ? `Assinatura de ${activeWorkspace.name}` : "Assinatura"}
      subtitle="Plano atual, limites de uso e pedido de upgrade ligados ao workspace autenticado."
      workspaceName={activeWorkspace?.name ?? "Workspace"}
      workspaceSlug={activeWorkspace?.slug}
      userName={user?.name}
      onLogout={() => void logout()}
    >
      {loading ? (
        <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <SkeletonBlock className="h-[460px]" />
          <SkeletonBlock className="h-[460px]" />
        </section>
      ) : null}

      {!loading && error ? <Card className="px-6 py-8"><EmptyState title="Nao foi possivel abrir a assinatura" description={error} action={<Button onClick={() => void loadPage()}>Tentar novamente</Button>} /></Card> : null}

      {!loading && !error && summary ? (
        <>
          {notice ? <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">{notice}</div> : null}

          <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
            <Card className="px-6 py-6 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionTag>Planos Fundador</SectionTag>
                  <h2 className="mt-4 text-3xl font-semibold text-slate-950">Escolha o plano que acompanha a operacao do estudio.</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-500">Os cards abaixo refletem o catalogo real retornado pelo backend do workspace.</p>
                </div>
                <SparkIcon className="h-6 w-6 text-slate-500" />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {summary.plans.map((plan) => {
                  const active = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`rounded-[28px] border px-5 py-5 text-left transition ${
                        active ? "border-slate-950 bg-slate-950 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.82)]" : "border-slate-200 bg-white/85 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${active ? "text-amber-300/80" : "text-slate-400"}`}>
                          {plan.current ? "Plano atual" : "Plano"}
                        </p>
                        {plan.current ? <Badge tone="success">ativo</Badge> : null}
                      </div>
                      <p className={`mt-4 text-2xl font-semibold ${active ? "text-white" : "text-slate-950"}`}>{plan.label}</p>
                      <p className={`mt-3 text-sm leading-6 ${active ? "text-white/70" : "text-slate-500"}`}>{plan.description}</p>
                      <p className={`mt-5 text-4xl font-semibold ${active ? "text-white" : "text-slate-950"}`}>{formatCurrency(plan.monthlyPriceCents)}</p>
                      <div className="mt-5 space-y-2">
                        {plan.features.map((feature) => (
                          <div key={feature} className={`flex items-center gap-2 rounded-[18px] px-3 py-2 text-sm ${active ? "bg-white/8 text-white" : "bg-slate-50 text-slate-700"}`}>
                            <CheckIcon className="h-4 w-4" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="surface-dark px-6 py-6 text-white sm:px-8">
                <SectionTag className="border-white/10 bg-white/10 text-white/80">Resumo mensal</SectionTag>
                <h3 className="mt-4 text-3xl font-semibold text-white">{summary.workspace.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">Plano atual: {summary.plans.find((plan) => plan.current)?.label ?? summary.subscription.plan}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] bg-white/8 px-4 py-4"><p className="text-[10px] uppercase tracking-[0.2em] text-white/54">Equipe</p><p className="mt-2 text-xl font-semibold">{summary.usage.staff}</p><p className="mt-1 text-xs text-white/60">{limitLabel(summary.limits.staff, "profissionais")}</p></div>
                  <div className="rounded-[20px] bg-white/8 px-4 py-4"><p className="text-[10px] uppercase tracking-[0.2em] text-white/54">Recursos</p><p className="mt-2 text-xl font-semibold">{summary.usage.resources}</p><p className="mt-1 text-xs text-white/60">{limitLabel(summary.limits.resources, "recursos")}</p></div>
                  <div className="rounded-[20px] bg-white/8 px-4 py-4"><p className="text-[10px] uppercase tracking-[0.2em] text-white/54">Atendimentos</p><p className="mt-2 text-xl font-semibold">{summary.usage.appointmentsThisMonth}</p><p className="mt-1 text-xs text-white/60">{limitLabel(summary.limits.appointments, "atend./mes")}</p></div>
                </div>
                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                  <p className="text-sm leading-7 text-slate-200">
                    Status: <strong>{summary.subscription.status}</strong>. Vigencia atual ate {formatDateTime(summary.subscription.paidUntil)}.
                  </p>
                </div>
              </Card>

              <Card className="px-6 py-6 sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SectionTag>Ativacao do plano</SectionTag>
                    <h3 className="mt-4 text-2xl font-semibold text-slate-950">Escolha a forma de ativacao desejada</h3>
                  </div>
                  <WalletIcon className="h-6 w-6 text-slate-500" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setPaymentMethod("pix")} className={`rounded-[22px] border px-4 py-4 text-left ${paymentMethod === "pix" ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white"}`}>
                    <p className="text-sm font-semibold">Pix empresarial</p>
                    <p className={`mt-2 text-sm ${paymentMethod === "pix" ? "text-white/70" : "text-slate-500"}`}>Fluxo mais rapido para ativacao comercial.</p>
                  </button>
                  <button type="button" onClick={() => setPaymentMethod("card")} className={`rounded-[22px] border px-4 py-4 text-left ${paymentMethod === "card" ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white"}`}>
                    <p className="text-sm font-semibold">Cartao corporativo</p>
                    <p className={`mt-2 text-sm ${paymentMethod === "card" ? "text-white/70" : "text-slate-500"}`}>Pedido registrado para ativacao com a forma selecionada.</p>
                  </button>
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-950">{selectedPlanCard?.label ?? "Plano selecionado"}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{selectedPlanCard?.description}</p>
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4">
                  <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <ShieldIcon className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-7 text-slate-500">
                    Esta tela nao simula checkout fake. Ela registra um pedido real de upgrade no backend, com trilha de auditoria por workspace.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button type="button" busy={submitting} disabled={!summary.canManage} onClick={() => void handleUpgradeRequest()}>
                    Solicitar ativacao do plano
                  </Button>
                  {!summary.canManage ? <Badge tone="warning">Somente owner/manager podem solicitar upgrade</Badge> : null}
                </div>
              </Card>
            </div>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
