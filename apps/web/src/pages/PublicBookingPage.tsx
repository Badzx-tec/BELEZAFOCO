import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge, Button, Card, CheckboxField, EmptyState, Field, Input, SectionTag, SkeletonBlock, Textarea } from "../components/ui";
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  FloatingBadge,
  ImageShowcase,
  PremiumMetricCard,
  ShieldIcon,
  SparkIcon,
  StepRail,
  WalletIcon
} from "../components/premium";
import { api } from "../lib/api";
import { formatCurrency, formatDateLabel, formatDateTime, formatTime, nextDateKeys } from "../lib/format";

type PublicWorkspaceData = {
  workspace: {
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
  };
  businessHours: Array<{
    weekday: number;
    startTime: string;
    endTime: string;
  }>;
  services: Array<{
    id: string;
    name: string;
    category: string;
    description: string | null;
    durationMinutes: number;
    prepMinutes: number;
    finishingMinutes: number;
    priceType: string;
    priceValue: number | null;
    depositEnabled: boolean;
    depositAmount: number | null;
    featured: boolean;
  }>;
  staffMembers: Array<{
    id: string;
    name: string;
    bio: string | null;
    colorHex: string;
    serviceIds: string[];
  }>;
};

type SlotPayload = {
  date: string;
  staff: Array<{ id: string; name: string; colorHex: string }>;
  slots: Array<{ staffMemberId: string; startAt: string }>;
};

type BookingResponse = {
  appointmentId: string;
  status: string;
  duplicate?: boolean;
  payment?: {
    externalId: string;
    qrCode: string;
    pixCopyPaste: string;
    ticketUrl?: string | null;
    expiresAt: string | null;
  } | null;
};

const dateOptions = nextDateKeys(7);
const initialSelectedDate = dateOptions.at(0) ?? new Date().toISOString().slice(0, 10);
const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function categoryImage(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("barb")) return "/niches/barbearia-premium.svg";
  if (normalized.includes("nail") || normalized.includes("mani")) return "/niches/nail-premium.svg";
  return "/niches/salao-premium.svg";
}

function staffPlaceholder(name: string) {
  return name.charCodeAt(0) % 2 === 0
    ? "/professionals-placeholders/artist-amber.svg"
    : "/professionals-placeholders/artist-graphite.svg";
}

function hoursLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1).replace(".", ",")}h`;
}

function summarizeBusinessHours(businessHours: PublicWorkspaceData["businessHours"]) {
  return businessHours
    .map((item) => `${weekdayLabels[item.weekday]} ${item.startTime} - ${item.endTime}`)
    .join(" · ");
}

export function PublicBookingPage() {
  const { slug = "" } = useParams();
  const [data, setData] = useState<PublicWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState<SlotPayload | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    if (!slug) {
      setData(null);
      setError("Slug publico ausente.");
      setLoading(false);
      return () => {
        active = false;
      };
    }

    api<PublicWorkspaceData>(`/public/b/${slug}`)
      .then((payload) => {
        if (!active) return;
        setData(payload);
        setSelectedServiceId((current) => current || payload.services?.at(0)?.id || "");
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason.message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const availableStaff = useMemo(() => {
    if (!data || !selectedServiceId) return [];
    return (data.staffMembers ?? []).filter((staff) => staff.serviceIds.includes(selectedServiceId));
  }, [data, selectedServiceId]);

  useEffect(() => {
    if (!availableStaff.length) {
      setSelectedStaffId("");
      return;
    }

    if (selectedStaffId && availableStaff.some((item) => item.id === selectedStaffId)) return;
    setSelectedStaffId("");
  }, [availableStaff, selectedStaffId]);

  useEffect(() => {
    if (!selectedServiceId) return;
    let active = true;

    setSlotsLoading(true);
    setSlotsError(null);
    setResult(null);

    const query = new URLSearchParams({
      serviceId: selectedServiceId,
      date: selectedDate,
      ...(selectedStaffId ? { staffMemberId: selectedStaffId } : {})
    });

    api<SlotPayload>(`/public/b/${slug}/slots?${query.toString()}`)
      .then((payload) => {
        if (!active) return;
        setSlots(payload);
        setSelectedSlot((current) => (payload.slots.some((item) => item.startAt === current) ? current : ""));
      })
      .catch((reason) => {
        if (!active) return;
        setSlotsError(reason.message);
      })
      .finally(() => {
        if (!active) return;
        setSlotsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDate, selectedServiceId, selectedStaffId, slug]);

  const services = data?.services ?? [];
  const staffMembers = data?.staffMembers ?? [];
  const slotItems = slots?.slots ?? [];
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
  const selectedStaffMember = staffMembers.find((staff) => staff.id === selectedStaffId) ?? null;
  const selectedSlotStaff = staffMembers.find((staff) => staff.id === slotItems.find((item) => item.startAt === selectedSlot)?.staffMemberId) ?? null;
  const selectedProfessional = selectedStaffMember ?? selectedSlotStaff ?? null;
  const stepsCompleted = [Boolean(selectedServiceId), Boolean(selectedSlot), Boolean(name && whatsapp && policyAccepted)].filter(Boolean).length;
  const brandStyle = data
    ? ({
        "--brand-primary": data.workspace.brandPrimaryColor,
        "--brand-accent": data.workspace.brandAccentColor
      } as CSSProperties)
    : undefined;
  const coverStyle = data
    ? ({
        background: `linear-gradient(135deg, ${data.workspace.brandPrimaryColor} 0%, ${data.workspace.brandAccentColor} 100%)`
      } as CSSProperties)
    : undefined;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedServiceId || !selectedSlot) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const idempotencyKey = window.crypto?.randomUUID?.() ?? `${Date.now()}`;
      const response = await api<BookingResponse>(`/public/b/${slug}/book`, {
        method: "POST",
        headers: { "x-idempotency-key": idempotencyKey },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          staffMemberId: selectedStaffId || slotItems.find((item) => item.startAt === selectedSlot)?.staffMemberId,
          startAt: selectedSlot,
          name,
          whatsapp,
          email: email || undefined,
          whatsappOptIn: true,
          policyAccepted,
          notes: notes || undefined
        })
      });

      setResult(response);
    } catch (reason) {
      setSubmitError((reason as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPixCode() {
    if (!result?.payment?.pixCopyPaste || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(result.payment.pixCopyPaste);
    setCopiedPix(true);
    window.setTimeout(() => setCopiedPix(false), 1800);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <SkeletonBlock className="h-[760px]" />
          <SkeletonBlock className="h-[760px]" />
        </div>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Card className="px-6 py-6 text-center">
          <SectionTag>Agendamento publico</SectionTag>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">Nao foi possivel carregar a pagina.</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">{error ?? "Verifique o slug publico e tente novamente."}</p>
          <div className="mt-5 flex justify-center">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8" style={brandStyle}>
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="space-y-6">
          <Card className="overflow-hidden px-6 py-6 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <SectionTag>Agendamento premium</SectionTag>
                <h1 className="mt-5 text-balance text-4xl font-semibold text-slate-950 sm:text-5xl">{data.workspace.name}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                  {data.workspace.description ?? "Atendimento profissional com jornada mobile-first e confirmacao clara."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge tone="accent">Resposta rapida por WhatsApp</Badge>
                  <Badge>{data.workspace.timezone}</Badge>
                  <Badge tone="warning">Antecedencia minima de {hoursLabel(data.workspace.minAdvanceMinutes)}</Badge>
                </div>
              </div>

              <div className="w-full max-w-[220px] rounded-[30px] px-5 py-5 text-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.76)]" style={coverStyle}>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/66">Contato direto</p>
                <p className="mt-3 text-xl font-semibold">{data.workspace.whatsapp ?? "WhatsApp ativo"}</p>
                <p className="mt-3 text-sm leading-6 text-white/78">{data.workspace.address ?? "Endereco informado no onboarding"}</p>
              </div>
            </div>

            <div className="mt-7 grid gap-5 lg:grid-cols-[1.04fr_0.96fr]">
              <div className="surface-dark relative overflow-hidden p-5 text-white sm:p-6">
                <FloatingBadge className="absolute left-4 top-4">
                  <SparkIcon className="h-3.5 w-3.5 text-amber-300" />
                  luxury experience
                </FloatingBadge>
                <div className="relative mt-10 grid gap-4 lg:grid-cols-[1fr_220px] lg:items-end">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-200/78">Fluxo mobile-first</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">Seu cliente sente o valor antes do primeiro atendimento.</h2>
                    <p className="mt-3 text-sm leading-7 text-white/68">
                      Escolha de servico, horario, dados e sinal no Pix em uma jornada curta, bonita e confiavel no celular.
                    </p>
                  </div>
                  <img
                    src="/marketing/mobile-booking-premium.svg"
                    alt="Mockup premium do agendamento publico"
                    className="mx-auto w-full max-w-[240px]"
                  />
                </div>
              </div>

              <div className="grid gap-4">
                <PremiumMetricCard
                  label="Horarios"
                  value="Agenda aberta"
                  detail={summarizeBusinessHours(data.businessHours)}
                  icon={<CalendarIcon className="h-5 w-5" />}
                />
                <PremiumMetricCard
                  label="Janela"
                  value="Reserva protegida"
                  detail={`Reservas ate ${data.workspace.maxAdvanceDays} dias no futuro.`}
                  icon={<ShieldIcon className="h-5 w-5" />}
                />
              </div>
            </div>
          </Card>

          <Card className="px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionTag>Etapa 1</SectionTag>
                <h2 className="mt-4 text-2xl font-semibold text-slate-950">Escolha o servico</h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">Comece pelo atendimento. O restante da agenda se ajusta em cima dele.</p>
              </div>
              <Badge tone="success">{services.length} opcoes ativas</Badge>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {services.map((service) => {
                const active = selectedServiceId === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`overflow-hidden rounded-[30px] border text-left transition duration-200 ${
                      active ? "border-transparent text-white shadow-[0_28px_70px_-38px_rgba(15,23,42,0.8)]" : "border-slate-200/80 bg-white hover:border-slate-300"
                    }`}
                    style={active ? { background: `linear-gradient(135deg, ${data.workspace.brandPrimaryColor}, ${data.workspace.brandAccentColor})` } : undefined}
                  >
                    <div className="grid gap-0 sm:grid-cols-[0.95fr_1.05fr]">
                      <div className={`p-5 ${active ? "bg-black/18" : "bg-slate-50/80"}`}>
                        <img src={categoryImage(service.category)} alt={service.category} className="w-full rounded-[24px]" />
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${active ? "text-white/66" : "text-slate-400"}`}>{service.category}</p>
                            <p className="mt-3 text-xl font-semibold">{service.name}</p>
                          </div>
                          {service.featured ? <Badge tone={active ? "warning" : "accent"}>{active ? "Mais pedido" : "Destaque"}</Badge> : null}
                        </div>
                        <p className={`mt-3 text-sm leading-7 ${active ? "text-white/76" : "text-slate-500"}`}>{service.description}</p>
                        <div className={`mt-4 flex flex-wrap gap-2 text-sm ${active ? "text-white/84" : "text-slate-700"}`}>
                          <span className={`rounded-full px-3 py-2 ${active ? "bg-white/12" : "bg-slate-100"}`}>{service.durationMinutes} min</span>
                          <span className={`rounded-full px-3 py-2 ${active ? "bg-white/12" : "bg-slate-100"}`}>{formatCurrency(service.priceValue)}</span>
                          {service.depositEnabled ? (
                            <span className={`rounded-full px-3 py-2 ${active ? "bg-white/12" : "bg-slate-100"}`}>Sinal {formatCurrency(service.depositAmount)}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionTag>Etapa 2</SectionTag>
                <h2 className="mt-4 text-2xl font-semibold text-slate-950">Profissional e horario</h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">Voce pode escolher um profissional especifico ou pedir o melhor horario disponivel.</p>
              </div>
              <Badge>{slotItems.length} horarios encontrados</Badge>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${selectedStaffId === "" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}
                onClick={() => setSelectedStaffId("")}
              >
                Melhor disponivel
              </button>
              {availableStaff.map((staff) => (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => setSelectedStaffId(staff.id)}
                  className={`flex items-center gap-3 rounded-full border px-3 py-2.5 text-sm font-semibold transition ${
                    selectedStaffId === staff.id ? "border-transparent text-white shadow-[0_20px_30px_-24px_rgba(15,23,42,0.8)]" : "border-slate-200 bg-white text-slate-700"
                  }`}
                  style={selectedStaffId === staff.id ? { backgroundColor: staff.colorHex } : undefined}
                >
                  <img src={staffPlaceholder(staff.name)} alt={staff.name} className="h-9 w-9 rounded-full object-cover" />
                  {staff.name}
                </button>
              ))}
            </div>

            {selectedStaffMember?.bio ? (
              <div className="mt-4 rounded-[26px] border border-slate-200/75 bg-slate-50/90 px-4 py-4 text-sm leading-7 text-slate-600">{selectedStaffMember.bio}</div>
            ) : null}

            <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
              {dateOptions.map((dateKey) => {
                const active = selectedDate === dateKey;
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    className={`min-w-[120px] rounded-[24px] px-4 py-4 text-left transition ${
                      active ? "bg-slate-950 text-white shadow-[0_20px_36px_-26px_rgba(15,23,42,0.8)]" : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${active ? "text-white/52" : "text-slate-400"}`}>Data</p>
                    <p className="mt-2 text-sm font-semibold">{formatDateLabel(dateKey)}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {slotsLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <SkeletonBlock key={index} className="h-16 rounded-[20px]" />
                  ))}
                </div>
              ) : slotsError ? (
                <div role="alert" className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                  {slotsError}
                </div>
              ) : slots?.slots.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {slotItems.map((slot) => {
                    const active = selectedSlot === slot.startAt;
                    const staff = staffMembers.find((item) => item.id === slot.staffMemberId);
                    return (
                      <button
                        key={`${slot.staffMemberId}-${slot.startAt}`}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot.startAt);
                          setSelectedStaffId(slot.staffMemberId);
                        }}
                        className={`rounded-[22px] border px-3 py-3 text-left transition ${
                          active ? "text-white shadow-[0_20px_32px_-24px_rgba(15,23,42,0.75)]" : "border-slate-200 bg-white"
                        }`}
                        style={active ? { borderColor: data.workspace.brandPrimaryColor, backgroundColor: data.workspace.brandPrimaryColor } : undefined}
                      >
                        <p className="text-lg font-semibold">{formatTime(slot.startAt)}</p>
                        <p className={`mt-1 text-xs ${active ? "text-white/72" : "text-slate-500"}`}>{staff?.name ?? "Disponivel"}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="Sem horarios abertos nessa combinacao"
                  description="Troque a data ou use 'melhor disponivel' para ampliar a agenda exibida."
                />
              )}
            </div>
          </Card>
        </section>

        <section className="space-y-6 lg:sticky lg:top-5 lg:self-start">
          <Card className="overflow-hidden px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionTag>Resumo da reserva</SectionTag>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">Seu horario em 3 passos</h2>
                </div>
                <div className="rounded-[24px] bg-slate-950 px-4 py-3 text-center text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">Progresso</p>
                  <p className="mt-2 text-2xl font-semibold">{stepsCompleted}/3</p>
                </div>
              </div>

              <StepRail
                className="mt-1"
                steps={[
                  { title: "Servico", done: Boolean(selectedServiceId) },
                  { title: "Horario", done: Boolean(selectedSlot) },
                  { title: "Dados", done: Boolean(name && whatsapp && policyAccepted), current: Boolean(selectedSlot) && !result }
                ]}
              />

              <div className="grid gap-3">
                <div className="rounded-[26px] border border-slate-200/75 bg-slate-50/88 px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Servico</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{selectedService?.name ?? "Selecione um servico"}</p>
                  <p className="mt-2 text-sm text-slate-500">{selectedService ? formatCurrency(selectedService.priceValue) : "Preco exibido apos escolha"}</p>
                </div>
                <div className="rounded-[26px] border border-slate-200/75 bg-slate-50/88 px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Horario</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{selectedSlot ? formatDateTime(selectedSlot) : "Escolha um horario"}</p>
                  <p className="mt-2 text-sm text-slate-500">{selectedProfessional?.name ?? "Profissional definido ao selecionar o slot"}</p>
                </div>
                {selectedProfessional ? (
                  <div className="flex items-center gap-3 rounded-[26px] border border-slate-200/75 bg-white/80 px-4 py-4">
                    <img src={staffPlaceholder(selectedProfessional.name)} alt={selectedProfessional.name} className="h-14 w-14 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{selectedProfessional.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{selectedProfessional.bio ?? "Profissional disponivel para o servico selecionado."}</p>
                    </div>
                  </div>
                ) : null}
                {selectedService?.depositEnabled ? (
                  <div className="rounded-[26px] border border-amber-200 bg-amber-50 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-600">
                        <WalletIcon className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Este servico aceita sinal via Pix</p>
                        <p className="mt-2 text-sm text-amber-800">Valor previsto do sinal: {formatCurrency(selectedService.depositAmount)}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>

          {result ? (
            <Card className="px-6 py-6 sm:px-8" aria-live="polite">
              <SectionTag>{result.status === "pending_payment" ? "Reserva iniciada" : "Agendamento confirmado"}</SectionTag>
              <h2 className="mt-4 text-balance text-3xl font-semibold text-slate-950">
                {result.status === "pending_payment" ? "Falta so concluir o Pix." : "Seu horario foi reservado com sucesso."}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Codigo do agendamento: <strong>{result.appointmentId}</strong>
              </p>

              {result.payment ? (
                <div className="mt-5 rounded-[30px] border border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                          <ShieldIcon className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Pix copia e cola</p>
                          <p className="mt-1 text-sm leading-7 text-slate-700">{result.payment.pixCopyPaste}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={copyPixCode}>
                          {copiedPix ? "Codigo copiado" : "Copiar codigo"}
                        </Button>
                        {result.payment.ticketUrl ? (
                          <a href={result.payment.ticketUrl} rel="noreferrer" target="_blank">
                            <Button variant="soft" size="sm">
                              Abrir QR em nova aba
                            </Button>
                          </a>
                        ) : null}
                      </div>
                      <p className="mt-4 text-xs text-slate-500">ID do pagamento: {result.payment.externalId}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Expira em {result.payment.expiresAt ? formatDateTime(result.payment.expiresAt) : "breve"}.
                      </p>
                    </div>
                    {result.payment.qrCode ? (
                      <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
                        <img alt="QR Code Pix do sinal" className="h-36 w-36 rounded-[18px] object-contain" src={result.payment.qrCode} />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </Card>
          ) : (
            <Card className="px-6 py-6 sm:px-8">
              <SectionTag>Etapa 3</SectionTag>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">Confirme seus dados</h2>
              <form className="mt-5 space-y-4" onSubmit={onSubmit}>
                <Field label="Nome completo" hint="Obrigatorio">
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Como devemos te chamar?" required />
                </Field>

                <Field label="WhatsApp" hint="Obrigatorio">
                  <Input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+55" required />
                </Field>

                <Field label="E-mail" hint="Opcional">
                  <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Para recibo e lembretes" type="email" />
                </Field>

                <Field label="Observacoes" hint="Opcional">
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Preferencia de atendimento, referencia ou observacao rapida."
                  />
                </Field>

                <CheckboxField
                  checked={policyAccepted}
                  onChange={(event) => setPolicyAccepted(event.target.checked)}
                  title="Li e aceito a politica do agendamento"
                  description={data.workspace.bookingPolicy ?? "Cancelamentos e reagendamentos seguem a politica definida pelo negocio."}
                />

                {submitError ? (
                  <div role="alert" className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {submitError}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  busy={submitting}
                  disabled={
                    submitting ||
                    !selectedService ||
                    !selectedSlot ||
                    !name ||
                    !whatsapp ||
                    !policyAccepted ||
                    (selectedStaffId === "" && !slotItems.some((item) => item.startAt === selectedSlot))
                  }
                >
                  {submitting ? "Confirmando..." : "Confirmar agendamento"}
                  {!submitting ? <ArrowRightIcon className="h-4 w-4" /> : null}
                </Button>

                <p className="text-center text-xs leading-6 text-slate-400">
                  Ao confirmar, voce recebe os detalhes do horario e, se houver sinal, o codigo Pix para concluir a reserva.
                </p>
              </form>
            </Card>
          )}

          <ImageShowcase
            image="/marketing/dashboard-spotlight.svg"
            alt="Painel premium e jornada do booking"
            className="min-h-[240px]"
            label="Experiencia premium"
            overlay={
              <FloatingBadge className="absolute left-4 top-16" style={{ backgroundColor: `${data.workspace.brandPrimaryColor}CC` }}>
                <ClockIcon className="h-3.5 w-3.5" />
                confirmacao mais rapida
              </FloatingBadge>
            }
          />
        </section>
      </div>
    </div>
  );
}
