import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { CalendarIcon, CheckIcon, SparkIcon, UsersIcon, WalletIcon } from "../components/premium";
import { Badge, Button, Card, EmptyState, Field, Input, SectionTag, SkeletonBlock, Textarea } from "../components/ui";
import { useAuth } from "../lib/auth";
import { buildPublicBookingUrl } from "../lib/auth-ui";
import { formatCurrency, readableError } from "../lib/format";

type WorkspacePayload = {
  name: string;
  slug: string;
  timezone: string;
  address: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
  description: string | null;
  bookingPolicy: string | null;
  brandPrimaryColor: string;
  brandAccentColor: string;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  freeCancelHours: number;
  lateCancelFeePercent: number;
  noShowFeePercent: number;
  onboardingStep: number;
  businessHours: Array<{ weekday: number; startTime: string; endTime: string }>;
};

type OnboardingSummary = {
  workspace: { slug: string };
  checklist: {
    items: Array<{ id: string; title: string; completed: boolean }>;
    completed: number;
    total: number;
    percent: number;
  };
  publicBookingUrl: string;
};

type ServiceItem = {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  priceValue: number | null;
  featured: boolean;
};

type StaffItem = {
  id: string;
  name: string;
  bio: string | null;
  colorHex: string;
  commissionPercent: number;
};

type ScheduleRow = { weekday: number; label: string; active: boolean; startTime: string; endTime: string };

const baseSchedule: ScheduleRow[] = [
  { weekday: 0, label: "Domingo", active: false, startTime: "09:00", endTime: "18:00" },
  { weekday: 1, label: "Segunda", active: true, startTime: "09:00", endTime: "19:00" },
  { weekday: 2, label: "Terca", active: true, startTime: "09:00", endTime: "19:00" },
  { weekday: 3, label: "Quarta", active: true, startTime: "09:00", endTime: "19:00" },
  { weekday: 4, label: "Quinta", active: true, startTime: "09:00", endTime: "19:00" },
  { weekday: 5, label: "Sexta", active: true, startTime: "09:00", endTime: "19:00" },
  { weekday: 6, label: "Sabado", active: true, startTime: "09:00", endTime: "16:00" }
];

function scheduleFromHours(hours: WorkspacePayload["businessHours"]) {
  const byDay = new Map(hours.map((item) => [item.weekday, item] as const));
  return baseSchedule.map((row) => {
    const current = byDay.get(row.weekday);
    return current ? { ...row, active: true, startTime: current.startTime, endTime: current.endTime } : row;
  });
}

function toCents(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function OnboardingPage() {
  const { user, activeWorkspace, authorizedApi, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [workspaceForm, setWorkspaceForm] = useState({
    name: "",
    address: "",
    whatsapp: "",
    logoUrl: "",
    description: "",
    bookingPolicy: "",
    timezone: "America/Sao_Paulo",
    brandPrimaryColor: "#0f172a",
    brandAccentColor: "#c26b36",
    minAdvanceMinutes: 120,
    maxAdvanceDays: 30,
    freeCancelHours: 24,
    lateCancelFeePercent: 0,
    noShowFeePercent: 0,
    onboardingStep: 2
  });
  const [schedule, setSchedule] = useState<ScheduleRow[]>(baseSchedule);
  const [serviceForm, setServiceForm] = useState({ name: "", category: "", durationMinutes: 45, priceValue: "85", featured: false });
  const [staffForm, setStaffForm] = useState({ name: "", bio: "", colorHex: "#0f172a", commissionPercent: 35, serviceIds: [] as string[] });

  async function loadPage() {
    setLoading(true);
    setError(null);
    try {
      const [workspace, onboarding, nextServices, nextStaff] = await Promise.all([
        authorizedApi<WorkspacePayload>("/me/workspace"),
        authorizedApi<OnboardingSummary>("/me/onboarding-summary"),
        authorizedApi<ServiceItem[]>("/me/services"),
        authorizedApi<StaffItem[]>("/me/staff")
      ]);
      setSummary(onboarding);
      setServices(nextServices);
      setStaff(nextStaff);
      setWorkspaceForm({
        name: workspace.name,
        address: workspace.address ?? "",
        whatsapp: workspace.whatsapp ?? "",
        logoUrl: workspace.logoUrl ?? "",
        description: workspace.description ?? "",
        bookingPolicy: workspace.bookingPolicy ?? "",
        timezone: workspace.timezone,
        brandPrimaryColor: workspace.brandPrimaryColor,
        brandAccentColor: workspace.brandAccentColor,
        minAdvanceMinutes: workspace.minAdvanceMinutes,
        maxAdvanceDays: workspace.maxAdvanceDays,
        freeCancelHours: workspace.freeCancelHours,
        lateCancelFeePercent: workspace.lateCancelFeePercent,
        noShowFeePercent: workspace.noShowFeePercent,
        onboardingStep: Math.max(workspace.onboardingStep, 2)
      });
      setSchedule(scheduleFromHours(workspace.businessHours));
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [authorizedApi, activeWorkspace?.id]);

  const publicBookingUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : null;
    return buildPublicBookingUrl(origin, activeWorkspace?.slug ?? summary?.workspace.slug ?? workspaceForm.name);
  }, [activeWorkspace?.slug, summary?.workspace.slug, workspaceForm.name]);

  async function saveWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    try {
      await authorizedApi("/me/workspace", {
        method: "PUT",
        body: JSON.stringify({
          ...workspaceForm,
          address: workspaceForm.address || null,
          whatsapp: workspaceForm.whatsapp || null,
          logoUrl: workspaceForm.logoUrl || null,
          description: workspaceForm.description || null,
          bookingPolicy: workspaceForm.bookingPolicy || null
        })
      });
      setNotice("Perfil do estudio salvo.");
      await loadPage();
    } catch (reason) {
      setError(readableError(reason));
    }
  }

  async function saveSchedule() {
    setNotice(null);
    setError(null);
    try {
      await authorizedApi("/me/business-hours", {
        method: "PUT",
        body: JSON.stringify(schedule.filter((item) => item.active).map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime })))
      });
      setNotice("Horarios atualizados.");
      await loadPage();
    } catch (reason) {
      setError(readableError(reason));
    }
  }

  async function addService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    try {
      await authorizedApi("/me/services", {
        method: "POST",
        body: JSON.stringify({
          name: serviceForm.name,
          category: serviceForm.category,
          description: null,
          durationMinutes: serviceForm.durationMinutes,
          prepMinutes: 0,
          finishingMinutes: 0,
          bufferBeforeMinutes: 0,
          bufferAfterMinutes: 0,
          priceType: "fixed",
          priceValue: toCents(serviceForm.priceValue),
          depositEnabled: false,
          depositType: null,
          depositValue: null,
          requiredResourceId: null,
          featured: serviceForm.featured,
          onlineBookingEnabled: true,
          displayOrder: services.length,
          active: true
        })
      });
      setServiceForm({ name: "", category: "", durationMinutes: 45, priceValue: "85", featured: false });
      setNotice("Servico adicionado.");
      await loadPage();
    } catch (reason) {
      setError(readableError(reason));
    }
  }

  async function addStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    try {
      if (!staffForm.serviceIds.length) {
        throw new Error("Selecione pelo menos um servico para a equipe.");
      }
      await authorizedApi("/me/staff", {
        method: "POST",
        body: JSON.stringify({
          name: staffForm.name,
          bio: staffForm.bio || null,
          contact: null,
          colorHex: staffForm.colorHex,
          commissionPercent: staffForm.commissionPercent,
          serviceIds: staffForm.serviceIds,
          availabilities: schedule.filter((item) => item.active).map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime }))
        })
      });
      setStaffForm({ name: "", bio: "", colorHex: "#0f172a", commissionPercent: 35, serviceIds: [] });
      setNotice("Profissional adicionado.");
      await loadPage();
    } catch (reason) {
      setError(readableError(reason));
    }
  }

  return (
    <AppShell
      activeSection="setup"
      title={activeWorkspace ? `Configurar estudio de ${activeWorkspace.name}` : "Configurar estudio"}
      subtitle="Perfil, equipe, servicos e horarios organizados em uma jornada de implantacao clara."
      workspaceName={activeWorkspace?.name ?? "Workspace"}
      workspaceSlug={activeWorkspace?.slug}
      userName={user?.name}
      onLogout={() => void logout()}
    >
      {loading ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <SkeletonBlock className="h-[340px]" />
            <SkeletonBlock className="h-[340px]" />
          </section>
          <section className="grid gap-6 xl:grid-cols-2">
            <SkeletonBlock className="h-[320px]" />
            <SkeletonBlock className="h-[320px]" />
          </section>
        </>
      ) : null}

      {!loading && error ? <Card className="px-6 py-8"><EmptyState title="Nao foi possivel abrir a configuracao" description={error} action={<Button onClick={() => void loadPage()}>Tentar novamente</Button>} /></Card> : null}

      {!loading && !error ? (
        <>
          {notice ? <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">{notice}</div> : null}

          <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
            <form onSubmit={saveWorkspace}>
              <Card className="px-6 py-6 sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SectionTag>Identidade do estudio</SectionTag>
                    <h2 className="mt-4 text-3xl font-semibold text-slate-950">Perfil comercial e link publico</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-500">Ajuste a base da marca e o texto que vai aparecer no booking.</p>
                  </div>
                  <SparkIcon className="h-6 w-6 text-slate-500" />
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field label="Nome comercial" className="sm:col-span-2"><Input value={workspaceForm.name} onChange={(event) => setWorkspaceForm((current) => ({ ...current, name: event.target.value }))} /></Field>
                  <Field label="WhatsApp"><Input value={workspaceForm.whatsapp} onChange={(event) => setWorkspaceForm((current) => ({ ...current, whatsapp: event.target.value }))} /></Field>
                  <Field label="Timezone"><Input value={workspaceForm.timezone} onChange={(event) => setWorkspaceForm((current) => ({ ...current, timezone: event.target.value }))} /></Field>
                  <Field label="Endereco" className="sm:col-span-2"><Input value={workspaceForm.address} onChange={(event) => setWorkspaceForm((current) => ({ ...current, address: event.target.value }))} /></Field>
                  <Field label="Descricao" className="sm:col-span-2"><Textarea value={workspaceForm.description} onChange={(event) => setWorkspaceForm((current) => ({ ...current, description: event.target.value }))} /></Field>
                  <Field label="Politica do agendamento" className="sm:col-span-2"><Textarea value={workspaceForm.bookingPolicy} onChange={(event) => setWorkspaceForm((current) => ({ ...current, bookingPolicy: event.target.value }))} /></Field>
                  <Field label="Cor principal"><Input type="color" className="h-14 rounded-[18px] p-2" value={workspaceForm.brandPrimaryColor} onChange={(event) => setWorkspaceForm((current) => ({ ...current, brandPrimaryColor: event.target.value }))} /></Field>
                  <Field label="Cor de destaque"><Input type="color" className="h-14 rounded-[18px] p-2" value={workspaceForm.brandAccentColor} onChange={(event) => setWorkspaceForm((current) => ({ ...current, brandAccentColor: event.target.value }))} /></Field>
                </div>
                <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Link publico</p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{publicBookingUrl}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button type="submit">Salvar perfil</Button>
                  <Link to="/app/billing"><Button type="button" variant="secondary">Abrir assinatura</Button></Link>
                </div>
              </Card>
            </form>

            <div className="space-y-6">
              <Card className="surface-dark px-6 py-6 text-white sm:px-8">
                <SectionTag className="border-white/10 bg-white/10 text-white/78">Resumo da configuracao</SectionTag>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/52">Progresso</p>
                    <p className="mt-2 text-4xl font-semibold">{summary?.checklist.percent ?? 0}%</p>
                  </div>
                  <Badge tone="accent" className="bg-amber-400/14 text-amber-100 ring-amber-300/20">{summary?.checklist.completed ?? 0}/{summary?.checklist.total ?? 0} etapas</Badge>
                </div>
                <div className="mt-5 space-y-3">
                  {summary?.checklist.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/6 px-4 py-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-2xl ${item.completed ? "bg-emerald-400/16 text-emerald-300" : "bg-white/10 text-white/52"}`}>
                        <CheckIcon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-semibold">{item.title}</span>
                      <Badge tone={item.completed ? "success" : "warning"}>{item.completed ? "ok" : "pendente"}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="px-6 py-6 sm:px-8">
                <SectionTag>Atalhos</SectionTag>
                <div className="mt-5 grid gap-3">
                  <a href={publicBookingUrl} target="_blank" rel="noreferrer"><Button type="button" className="w-full justify-between">Testar link publico <ExternalArrow /></Button></a>
                  <Link to="/app/billing"><Button type="button" variant="secondary" className="w-full justify-between">Ver assinatura <ExternalArrow /></Button></Link>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-slate-200 bg-white/80 px-4 py-4"><p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Servicos</p><p className="mt-2 text-2xl font-semibold text-slate-950">{services.length}</p></div>
                  <div className="rounded-[20px] border border-slate-200 bg-white/80 px-4 py-4"><p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Equipe</p><p className="mt-2 text-2xl font-semibold text-slate-950">{staff.length}</p></div>
                </div>
              </Card>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="px-6 py-6 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionTag>Servicos</SectionTag>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">Catalogo conectado ao booking</h2>
                </div>
                <WalletIcon className="h-6 w-6 text-slate-500" />
              </div>
              <div className="mt-5 space-y-3">
                {services.length ? services.map((service) => (
                  <div key={service.id} className="rounded-[20px] border border-slate-200 bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="font-semibold text-slate-950">{service.name}</p><p className="mt-1 text-sm text-slate-500">{service.category} | {service.durationMinutes} min</p></div>
                      <Badge tone={service.featured ? "accent" : "neutral"}>{formatCurrency(service.priceValue)}</Badge>
                    </div>
                  </div>
                )) : <EmptyState title="Nenhum servico ainda" description="Adicione o primeiro servico para liberar equipe e link publico." />}
              </div>
              <form className="mt-6 grid gap-4" onSubmit={addService}>
                <Field label="Nome do servico"><Input value={serviceForm.name} onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Categoria"><Input value={serviceForm.category} onChange={(event) => setServiceForm((current) => ({ ...current, category: event.target.value }))} /></Field>
                  <Field label="Duracao (min)"><Input type="number" value={serviceForm.durationMinutes} onChange={(event) => setServiceForm((current) => ({ ...current, durationMinutes: Number(event.target.value) || 0 }))} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Preco (R$)"><Input value={serviceForm.priceValue} onChange={(event) => setServiceForm((current) => ({ ...current, priceValue: event.target.value }))} /></Field>
                  <label className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white/80 px-4 py-4 text-sm font-semibold text-slate-700"><input type="checkbox" checked={serviceForm.featured} onChange={(event) => setServiceForm((current) => ({ ...current, featured: event.target.checked }))} /> Destacar no booking</label>
                </div>
                <Button type="submit">Adicionar servico</Button>
              </form>
            </Card>

            <Card className="px-6 py-6 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionTag>Equipe</SectionTag>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">Profissionais da agenda</h2>
                </div>
                <UsersIcon className="h-6 w-6 text-slate-500" />
              </div>
              <div className="mt-5 space-y-3">
                {staff.length ? staff.map((item) => (
                  <div key={item.id} className="rounded-[20px] border border-slate-200 bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold text-white" style={{ backgroundColor: item.colorHex }}>{item.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</span>
                        <div><p className="font-semibold text-slate-950">{item.name}</p><p className="mt-1 text-sm text-slate-500">{item.bio ?? "Profissional ativo no workspace."}</p></div>
                      </div>
                      <Badge tone="accent">{item.commissionPercent}%</Badge>
                    </div>
                  </div>
                )) : <EmptyState title="Equipe vazia" description="Cadastre pelo menos um profissional para comecar a operar." />}
              </div>
              <form className="mt-6 grid gap-4" onSubmit={addStaff}>
                <Field label="Nome do profissional"><Input value={staffForm.name} onChange={(event) => setStaffForm((current) => ({ ...current, name: event.target.value }))} /></Field>
                <Field label="Bio"><Textarea value={staffForm.bio} onChange={(event) => setStaffForm((current) => ({ ...current, bio: event.target.value }))} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Comissao (%)"><Input type="number" value={staffForm.commissionPercent} onChange={(event) => setStaffForm((current) => ({ ...current, commissionPercent: Number(event.target.value) || 0 }))} /></Field>
                  <Field label="Cor da agenda"><Input type="color" className="h-14 rounded-[18px] p-2" value={staffForm.colorHex} onChange={(event) => setStaffForm((current) => ({ ...current, colorHex: event.target.value }))} /></Field>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">Servicos atendidos</p>
                  <div className="grid gap-2">
                    {services.length ? services.map((service) => (
                      <label key={service.id} className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700">
                        <input type="checkbox" checked={staffForm.serviceIds.includes(service.id)} onChange={(event) => setStaffForm((current) => ({ ...current, serviceIds: event.target.checked ? [...current.serviceIds, service.id] : current.serviceIds.filter((serviceId) => serviceId !== service.id) }))} />
                        <span className="font-medium">{service.name}</span>
                      </label>
                    )) : <p className="text-sm text-slate-500">Cadastre um servico antes de adicionar equipe.</p>}
                  </div>
                </div>
                <Button type="submit" disabled={!services.length}>Adicionar profissional</Button>
              </form>
            </Card>
          </section>

          <section>
            <Card className="px-6 py-6 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionTag>Horarios</SectionTag>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">Jornada base do estudio</h2>
                </div>
                <CalendarIcon className="h-6 w-6 text-slate-500" />
              </div>
              <div className="mt-6 space-y-3">
                {schedule.map((item, index) => (
                  <div key={item.weekday} className="grid gap-3 rounded-[20px] border border-slate-200 bg-white/80 px-4 py-4 sm:grid-cols-[180px_1fr_auto] sm:items-center">
                    <label className="flex items-center gap-3 text-sm font-semibold text-slate-900"><input type="checkbox" checked={item.active} onChange={(event) => setSchedule((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, active: event.target.checked } : row))} /> {item.label}</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input type="time" value={item.startTime} disabled={!item.active} onChange={(event) => setSchedule((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, startTime: event.target.value } : row))} />
                      <Input type="time" value={item.endTime} disabled={!item.active} onChange={(event) => setSchedule((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, endTime: event.target.value } : row))} />
                    </div>
                    <Badge tone={item.active ? "success" : "neutral"}>{item.active ? "Ativo" : "Fechado"}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="button" onClick={() => void saveSchedule()}>Salvar horarios</Button>
                <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">Dias ativos: {schedule.filter((item) => item.active).length}</div>
              </div>
            </Card>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}

function ExternalArrow() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}
