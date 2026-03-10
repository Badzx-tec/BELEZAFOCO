import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { AuthExperience } from "../components/AuthExperience";
import { Badge, Button, Card, EmptyState, Field, Input, SectionTitle, Skeleton, StatCard, TextArea } from "../components/ui";
import { ApiError, api, clearSession, loadSession, saveSession, type Session } from "../lib/api";
import { currencyInCents, readableError } from "../lib/format";
import { syncSentrySession } from "../lib/sentry";

type BusinessHour = {
  weekday: number;
  startTime: string;
  endTime: string;
  isClosed: boolean;
};

type DashboardData = {
  workspace: { name: string; publicUrl: string };
  subscription: { plan: string; status: string };
  checklist: Array<{ key: string; label: string; done: boolean }>;
  summary: {
    appointmentsToday: number;
    confirmedToday: number;
    occupancyRate: number;
    revenuePipeline: number;
    clientCount: number;
  };
  upcoming: Array<{ id: string; clientName: string; serviceName: string; staffName: string; status: string; startAt: string }>;
};

type WorkspaceResponse = {
  workspace: {
    name: string;
    slug: string;
    address?: string | null;
    whatsapp?: string | null;
    contactEmail?: string | null;
    about?: string | null;
    brandPrimary: string;
    brandAccent: string;
    minAdvanceMinutes: number;
    maxAdvanceDays: number;
    publicBookingEnabled: boolean;
  };
  businessHours: BusinessHour[];
};

type Service = { id: string; name: string; category: string; durationMinutes: number; priceValue?: number | null; featured: boolean; depositEnabled: boolean };
type StaffMember = { id: string; name: string; commissionPercent: number };
type Resource = { id: string; name: string; type: string; capacity: number };
type Client = { id: string; name: string; whatsapp: string; stats: { totalAppointments: number; recurring: boolean } };

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const defaultHours = weekdays.map((_, weekday) => ({
  weekday,
  startTime: "09:00",
  endTime: weekday === 6 ? "17:00" : "19:00",
  isClosed: weekday === 0
}));

export function DashboardPage() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState({ name: "", slug: "", address: "", whatsapp: "", contactEmail: "", about: "", brandPrimary: "#111827", brandAccent: "#c48b5a" });
  const [hours, setHours] = useState<BusinessHour[]>(defaultHours);
  const [serviceForm, setServiceForm] = useState({ name: "", category: "Corte", durationMinutes: "45", priceValue: "60", depositEnabled: false });
  const [staffForm, setStaffForm] = useState({ name: "", commissionPercent: "40", serviceIds: [] as string[] });
  const [resourceForm, setResourceForm] = useState({ name: "", type: "Cadeira", capacity: "1" });

  useEffect(() => {
    if (!session) return;
    void refresh(session);
  }, [session]);

  useEffect(() => {
    syncSentrySession(session);
  }, [session]);

  useEffect(() => {
    if (!workspace) return;
    setProfile({
      name: workspace.workspace.name,
      slug: workspace.workspace.slug,
      address: workspace.workspace.address ?? "",
      whatsapp: workspace.workspace.whatsapp ?? "",
      contactEmail: workspace.workspace.contactEmail ?? "",
      about: workspace.workspace.about ?? "",
      brandPrimary: workspace.workspace.brandPrimary,
      brandAccent: workspace.workspace.brandAccent
    });
    setHours(workspace.businessHours.length ? workspace.businessHours : defaultHours);
  }, [workspace]);

  async function refresh(currentSession: Session) {
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, workspaceResponse, servicesResponse, staffResponse, resourcesResponse, clientsResponse] = await Promise.all([
        api<DashboardData>("/me/dashboard", { session: currentSession }),
        api<WorkspaceResponse>("/me/workspace", { session: currentSession }),
        api<Service[]>("/me/services", { session: currentSession }),
        api<StaffMember[]>("/me/staff", { session: currentSession }),
        api<Resource[]>("/me/resources", { session: currentSession }),
        api<Client[]>("/me/clients", { session: currentSession })
      ]);
      setDashboard(dashboardResponse);
      setWorkspace(workspaceResponse);
      setServices(servicesResponse);
      setStaff(staffResponse);
      setResources(resourcesResponse);
      setClients(clientsResponse);
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.statusCode === 401) {
        clearSession();
        setSession(null);
        return;
      }
      setError(readableError(caughtError));
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return <AuthExperience onAuthenticated={setActiveSession} />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(196,139,90,0.18),_transparent_32%),linear-gradient(180deg,#fcfaf6_0%,#f6f1e8_52%,#f4efe8_100%)]">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-5 md:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 lg:block">
          <Card className="sticky top-5 space-y-5 bg-slate-950 text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/50">BELEZAFOCO</p>
              <h1 className="mt-3 font-display text-3xl">{dashboard?.workspace.name ?? "Workspace"}</h1>
              <p className="mt-3 text-sm text-white/65">Operacao diaria, onboarding e link publico no mesmo cockpit.</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/50">Plano</p>
              <p className="mt-2 text-lg font-semibold capitalize">{dashboard?.subscription.plan ?? "trial"}</p>
              <p className="text-sm text-white/65">Status {dashboard?.subscription.status ?? "trialing"}</p>
            </div>
            <div className="grid gap-2 text-sm">
              {["Resumo", "Identidade", "Servicos", "Equipe", "Clientes"].map((item) => (
                <div key={item} className="rounded-2xl bg-white/6 px-4 py-3 text-white/80">{item}</div>
              ))}
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                clearSession();
                setSession(null);
              }}
            >
              Sair
            </Button>
          </Card>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <Card className="overflow-hidden bg-slate-950 text-white">
              <div className="relative space-y-5">
                <div className="absolute inset-y-0 right-0 w-40 rounded-full blur-3xl" style={{ backgroundColor: "rgba(196, 139, 90, 0.3)" }} />
                <Badge tone="warning">Pronto para vender localmente</Badge>
                <div className="relative space-y-4">
                  <h2 className="font-display text-4xl">Agenda, WhatsApp, Pix e operacao em uma tela.</h2>
                  <p className="max-w-2xl text-sm leading-7 text-white/70">
                    Configure a identidade do negocio, publique o link de reserva e acompanhe a rotina do dia com foco em implantacao rapida e reducao de faltas.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => {
                        if (dashboard?.workspace.publicUrl) void navigator.clipboard.writeText(dashboard.workspace.publicUrl);
                      }}
                    >
                      Copiar link publico
                    </Button>
                    <Button variant="secondary" onClick={() => void refresh(session)}>
                      Atualizar painel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="space-y-4">
              <SectionTitle eyebrow="Checklist" title="Implantacao guiada" description="O que falta para publicar e operar com seguranca." />
              {loading || !dashboard ? (
                <div className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
              ) : (
                dashboard.checklist.map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <Badge tone={item.done ? "success" : "warning"}>{item.done ? "Concluido" : "Pendente"}</Badge>
                  </div>
                ))
              )}
            </Card>
          </section>

          {error ? <Card className="border-rose-200 bg-rose-50 text-sm text-rose-800">{error}</Card> : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {loading || !dashboard ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-36" />) : (
              <>
                <StatCard label="Atendimentos hoje" value={String(dashboard.summary.appointmentsToday)} help="Visao operacional" />
                <StatCard label="Confirmados" value={String(dashboard.summary.confirmedToday)} help="Base para no-show menor" />
                <StatCard label="Ocupacao" value={`${dashboard.summary.occupancyRate}%`} help="Carga do dia" />
                <StatCard label="Receita prevista" value={currencyInCents(dashboard.summary.revenuePipeline)} help="Mes corrente" />
                <StatCard label="Clientes ativos" value={String(dashboard.summary.clientCount)} help="Base do workspace" />
              </>
            )}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
            <Card className="space-y-4">
              <SectionTitle eyebrow="Hoje" title="Proximos atendimentos" description="Painel do dia para recepcao, dono ou gerente." />
              {!dashboard || dashboard.upcoming.length === 0 ? (
                <EmptyState title="Nenhum atendimento hoje" description="Publique o booking ou crie um atendimento interno para alimentar a agenda." />
              ) : (
                <div className="space-y-3">
                  {dashboard.upcoming.map((item) => (
                    <div key={item.id} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-[120px_1fr_auto] md:items-center">
                      <p className="text-lg font-semibold text-slate-900">{new Date(item.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      <div>
                        <p className="font-semibold text-slate-900">{item.clientName}</p>
                        <p className="text-sm text-slate-500">{item.serviceName} com {item.staffName}</p>
                      </div>
                      <Badge tone={item.status === "confirmed" ? "success" : "neutral"}>{item.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card className="space-y-4">
              <SectionTitle eyebrow="Publico" title="Identidade do negocio" description="O que o cliente final vai ver ao agendar." />
              <form className="space-y-4" onSubmit={saveProfile}>
                <Field label="Nome do negocio"><Input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Slug publico"><Input value={profile.slug} onChange={(event) => setProfile({ ...profile, slug: event.target.value })} /></Field>
                  <Field label="WhatsApp"><Input value={profile.whatsapp} onChange={(event) => setProfile({ ...profile, whatsapp: event.target.value })} /></Field>
                </div>
                <Field label="Endereco"><Input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></Field>
                <Field label="Texto de apresentacao"><TextArea value={profile.about} onChange={(event) => setProfile({ ...profile, about: event.target.value })} /></Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Cor primaria"><Input type="color" value={profile.brandPrimary} onChange={(event) => setProfile({ ...profile, brandPrimary: event.target.value })} /></Field>
                  <Field label="Cor destaque"><Input type="color" value={profile.brandAccent} onChange={(event) => setProfile({ ...profile, brandAccent: event.target.value })} /></Field>
                </div>
                <Button className="w-full" type="submit">Salvar identidade</Button>
              </form>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <FormCard title="Horarios" description="Base para slots e distribuicao da equipe." onSubmit={saveHours}>
              {hours.map((item, index) => (
                <div key={item.weekday} className="grid grid-cols-[72px_1fr_1fr_auto] items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-medium text-slate-700">{weekdays[item.weekday]}</span>
                  <Input aria-label={`Inicio ${weekdays[item.weekday]}`} disabled={item.isClosed} name={`business-hour-${item.weekday}-start`} type="time" value={item.startTime} onChange={(event) => updateHour(index, { startTime: event.target.value })} />
                  <Input aria-label={`Fim ${weekdays[item.weekday]}`} disabled={item.isClosed} name={`business-hour-${item.weekday}-end`} type="time" value={item.endTime} onChange={(event) => updateHour(index, { endTime: event.target.value })} />
                  <label className="flex items-center gap-2 text-sm text-slate-500" htmlFor={`business-hour-${item.weekday}-closed`}><input checked={item.isClosed} className="h-4 w-4 accent-slate-950" id={`business-hour-${item.weekday}-closed`} name={`business-hour-${item.weekday}-closed`} onChange={(event) => updateHour(index, { isClosed: event.target.checked })} type="checkbox" />Folga</label>
                </div>
              ))}
            </FormCard>

            <FormCard title="Novo servico" description="Cadastre os servicos com mais potencial de venda." onSubmit={saveService}>
              <Field label="Nome"><Input value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} /></Field>
              <Field label="Categoria"><Input value={serviceForm.category} onChange={(event) => setServiceForm({ ...serviceForm, category: event.target.value })} /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Duracao"><Input type="number" value={serviceForm.durationMinutes} onChange={(event) => setServiceForm({ ...serviceForm, durationMinutes: event.target.value })} /></Field>
                <Field label="Preco"><Input type="number" value={serviceForm.priceValue} onChange={(event) => setServiceForm({ ...serviceForm, priceValue: event.target.value })} /></Field>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600" htmlFor="service-deposit-enabled"><input checked={serviceForm.depositEnabled} className="h-4 w-4 accent-slate-950" id="service-deposit-enabled" name="serviceDepositEnabled" onChange={(event) => setServiceForm({ ...serviceForm, depositEnabled: event.target.checked })} type="checkbox" />Exigir sinal via Pix</label>
            </FormCard>

            <Card className="space-y-4">
              <SectionTitle eyebrow="Catalogo" title="Servicos publicados" description="Os destaques ajudam a converter no agendamento publico." />
              {services.length === 0 ? <EmptyState title="Nenhum servico ainda" description="Cadastre os servicos principais para liberar o booking." /> : services.map((service) => (
                <div key={service.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="font-semibold text-slate-900">{service.name}</p><p className="text-sm text-slate-500">{service.category}</p></div>
                    {service.featured ? <Badge tone="warning">Destaque</Badge> : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-600"><span>{service.durationMinutes} min</span><span>{currencyInCents(service.priceValue ?? 0)}</span></div>
                </div>
              ))}
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <FormCard title="Novo profissional" description="Atribua servicos e replique os horarios do negocio." onSubmit={saveStaff}>
              <Field label="Nome"><Input value={staffForm.name} onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })} /></Field>
              <Field label="Comissao (%)"><Input type="number" value={staffForm.commissionPercent} onChange={(event) => setStaffForm({ ...staffForm, commissionPercent: event.target.value })} /></Field>
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {services.map((service) => (
                  <label key={service.id} className="flex items-center gap-3 text-sm text-slate-600" htmlFor={`staff-service-${service.id}`}>
                    <input
                      checked={staffForm.serviceIds.includes(service.id)}
                      className="h-4 w-4 accent-slate-950"
                      id={`staff-service-${service.id}`}
                      name={`staff-service-${service.id}`}
                      onChange={(event) => setStaffForm({
                        ...staffForm,
                        serviceIds: event.target.checked ? [...staffForm.serviceIds, service.id] : staffForm.serviceIds.filter((id) => id !== service.id)
                      })}
                      type="checkbox"
                    />
                    {service.name}
                  </label>
                ))}
              </div>
            </FormCard>

            <FormCard title="Novo recurso" description="Evite conflito de cadeiras, salas e macas." onSubmit={saveResource}>
              <Field label="Nome"><Input value={resourceForm.name} onChange={(event) => setResourceForm({ ...resourceForm, name: event.target.value })} /></Field>
              <Field label="Tipo"><Input value={resourceForm.type} onChange={(event) => setResourceForm({ ...resourceForm, type: event.target.value })} /></Field>
              <Field label="Capacidade"><Input type="number" value={resourceForm.capacity} onChange={(event) => setResourceForm({ ...resourceForm, capacity: event.target.value })} /></Field>
            </FormCard>

            <Card className="space-y-4">
              <SectionTitle eyebrow="Operacao" title="Equipe e recursos" description="Visao rapida do que ja esta preparado para booking." />
              <div className="space-y-3">
                {staff.map((member) => <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"><span className="font-semibold text-slate-900">{member.name}</span><span className="ml-2 text-slate-500">Comissao {member.commissionPercent}%</span></div>)}
                {resources.map((resource) => <div key={resource.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"><span className="font-semibold text-slate-900">{resource.name}</span><span className="ml-2 text-slate-500">{resource.type} - capacidade {resource.capacity}</span></div>)}
                {staff.length === 0 && resources.length === 0 ? <EmptyState title="Equipe e recursos vazios" description="Cadastre profissionais e recursos para operar com mais controle." /> : null}
              </div>
            </Card>
          </section>

          <section>
            <Card className="space-y-4">
              <SectionTitle eyebrow="CRM leve" title="Clientes recorrentes" description="Resumo rapido para relacionamento e reativacao." />
              {clients.length === 0 ? <EmptyState title="Nenhum cliente ainda" description="Os clientes entram automaticamente pelos agendamentos internos e publicos." /> : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {clients.slice(0, 6).map((client) => (
                    <div key={client.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{client.name}</p>
                      <p className="mt-2 text-sm text-slate-500">{client.whatsapp}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-slate-600">{client.stats.totalAppointments} atendimentos</span>
                        <Badge tone={client.stats.recurring ? "success" : "neutral"}>{client.stats.recurring ? "Recorrente" : "Novo"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
        </main>
      </div>
    </div>
  );

  function setActiveSession(nextSession: Session) {
    saveSession(nextSession);
    setSession(nextSession);
  }

  function updateHour(index: number, patch: Partial<BusinessHour>) {
    setHours((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentSession = session;
    if (!currentSession) return;
    await api("/me/workspace", {
      method: "PUT",
      session: currentSession,
      body: JSON.stringify({
        name: profile.name,
        slug: profile.slug,
        timezone: "America/Sao_Paulo",
        address: profile.address || null,
        whatsapp: profile.whatsapp || null,
        contactEmail: profile.contactEmail || null,
        brandPrimary: profile.brandPrimary,
        brandAccent: profile.brandAccent,
        about: profile.about || null,
        minAdvanceMinutes: workspace?.workspace.minAdvanceMinutes ?? 120,
        maxAdvanceDays: workspace?.workspace.maxAdvanceDays ?? 30,
        freeCancelHours: 24,
        lateCancelFeePercent: 0,
        noShowFeePercent: 0,
        slotIntervalMinutes: 15,
        publicBookingEnabled: workspace?.workspace.publicBookingEnabled ?? true,
        onboardingStep: 2
      })
    });
    await refresh(currentSession);
  }

  async function saveHours(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentSession = session;
    if (!currentSession) return;
    await api("/me/business-hours", { method: "PUT", session: currentSession, body: JSON.stringify(hours) });
    await refresh(currentSession);
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentSession = session;
    if (!currentSession) return;
    await api("/me/services", {
      method: "POST",
      session: currentSession,
      body: JSON.stringify({
        name: serviceForm.name,
        category: serviceForm.category,
        durationMinutes: Number(serviceForm.durationMinutes),
        priceType: "fixed",
        priceValue: Number(serviceForm.priceValue),
        depositEnabled: serviceForm.depositEnabled,
        depositType: serviceForm.depositEnabled ? "fixed" : null,
        depositValue: serviceForm.depositEnabled ? Math.round(Number(serviceForm.priceValue) * 0.2) : null,
        featured: services.length === 0
      })
    });
    setServiceForm({ name: "", category: "Corte", durationMinutes: "45", priceValue: "60", depositEnabled: false });
    await refresh(currentSession);
  }

  async function saveStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentSession = session;
    if (!currentSession) return;
    await api("/me/staff", {
      method: "POST",
      session: currentSession,
      body: JSON.stringify({
        name: staffForm.name,
        commissionPercent: Number(staffForm.commissionPercent),
        color: "#0f172a",
        serviceIds: staffForm.serviceIds,
        availabilities: hours.filter((item) => !item.isClosed).map((item) => ({ weekday: item.weekday, startTime: item.startTime, endTime: item.endTime }))
      })
    });
    setStaffForm({ name: "", commissionPercent: "40", serviceIds: [] });
    await refresh(currentSession);
  }

  async function saveResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentSession = session;
    if (!currentSession) return;
    await api("/me/resources", {
      method: "POST",
      session: currentSession,
      body: JSON.stringify({ name: resourceForm.name, type: resourceForm.type, capacity: Number(resourceForm.capacity) })
    });
    setResourceForm({ name: "", type: "Cadeira", capacity: "1" });
    await refresh(currentSession);
  }
}

function FormCard({ title, description, onSubmit, children }: { title: string; description: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode }) {
  return (
    <Card className="space-y-4">
      <SectionTitle eyebrow="Cadastro" title={title} description={description} />
      <form className="space-y-4" onSubmit={onSubmit}>
        {children}
        <Button className="w-full" type="submit">Salvar</Button>
      </form>
    </Card>
  );
}
