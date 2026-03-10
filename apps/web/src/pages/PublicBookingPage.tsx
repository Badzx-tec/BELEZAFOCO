import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge, Button, Card, CheckboxField, EmptyState, Field, Input, SectionTag, SkeletonBlock, Textarea } from "../components/ui";
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
  const stepsCompleted = [Boolean(selectedServiceId), Boolean(selectedSlot), Boolean(name && whatsapp && policyAccepted)].filter(Boolean).length;
  const brandStyle = data
    ? ({
        "--brand-primary": data.workspace.brandPrimaryColor,
        "--brand-accent": data.workspace.brandAccentColor
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
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <SectionTag>Agendamento online</SectionTag>
                <h1 className="mt-4 text-balance text-4xl font-semibold text-slate-950">{data.workspace.name}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{data.workspace.description}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge tone="accent">Resposta rapida por WhatsApp</Badge>
                  <Badge>{data.workspace.timezone}</Badge>
                  <Badge tone="warning">Antecedencia minima de {data.workspace.minAdvanceMinutes / 60}h</Badge>
                </div>
              </div>

              <div
                className="rounded-[30px] px-5 py-5 text-white shadow-[0_20px_40px_-28px_rgba(15,23,42,0.9)]"
                style={{ backgroundColor: data.workspace.brandPrimaryColor }}
              >
                <p className="text-xs uppercase tracking-[0.28em] text-white/70">Atendimento</p>
                <p className="mt-3 text-xl font-semibold">{data.workspace.whatsapp ?? "WhatsApp ativo"}</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">{data.workspace.address ?? "Endereco informado no onboarding"}</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[30px] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] text-white">
              <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80">Fluxo mobile-first</p>
                  <h2 className="mt-3 text-2xl font-semibold">Seu cliente sente a qualidade antes do primeiro atendimento.</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                    Escolha de servico, horario, sinal e confirmacao desenhados para reduzir atrito em celular e aumentar a percepcao de valor.
                  </p>
                </div>
                <img
                  src="/marketing/booking-cover.svg"
                  alt="Mockup do fluxo publico de agendamento no celular"
                  className="mx-auto w-full max-w-[360px]"
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] bg-slate-50/90 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Horarios</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{summarizeBusinessHours(data.businessHours)}</p>
              </div>
              <div className="rounded-[24px] bg-slate-50/90 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Janela de reserva</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Ate {data.workspace.maxAdvanceDays} dias no futuro</p>
              </div>
              <div className="rounded-[24px] bg-slate-50/90 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Politica</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Cancelamentos com regra definida</p>
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

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {services.map((service) => {
                const active = selectedServiceId === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`rounded-[30px] border px-5 py-5 text-left transition duration-200 ${
                      active ? "text-white shadow-[0_24px_54px_-36px_rgba(15,23,42,0.8)]" : "border-slate-200/80 bg-white hover:border-slate-300"
                    }`}
                    style={active ? { borderColor: data.workspace.brandPrimaryColor, backgroundColor: data.workspace.brandPrimaryColor } : undefined}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${active ? "text-white/65" : "text-slate-400"}`}>{service.category}</p>
                        <p className="mt-3 text-xl font-semibold">{service.name}</p>
                      </div>
                      {service.featured ? <Badge tone={active ? "warning" : "accent"}>{active ? "Mais pedido" : "Destaque"}</Badge> : null}
                    </div>
                    <p className={`mt-3 text-sm leading-7 ${active ? "text-white/78" : "text-slate-500"}`}>{service.description}</p>
                    <div className={`mt-4 flex flex-wrap gap-2 text-sm ${active ? "text-white/82" : "text-slate-600"}`}>
                      <span className={`rounded-full px-3 py-2 ${active ? "bg-white/10" : "bg-slate-100"}`}>{service.durationMinutes} min</span>
                      <span className={`rounded-full px-3 py-2 ${active ? "bg-white/10" : "bg-slate-100"}`}>{formatCurrency(service.priceValue)}</span>
                      {service.depositEnabled ? (
                        <span className={`rounded-full px-3 py-2 ${active ? "bg-white/10" : "bg-slate-100"}`}>Sinal {formatCurrency(service.depositAmount)}</span>
                      ) : null}
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

            <div className="mt-5 flex flex-wrap gap-3">
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
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${selectedStaffId === staff.id ? "text-white shadow-[0_20px_30px_-24px_rgba(15,23,42,0.8)]" : "text-slate-700"}`}
                  style={{ backgroundColor: selectedStaffId === staff.id ? staff.colorHex : "#e2e8f0" }}
                >
                  {staff.name}
                </button>
              ))}
            </div>

            {selectedStaffMember?.bio ? (
              <div className="mt-4 rounded-[24px] bg-slate-50/90 px-4 py-4 text-sm leading-6 text-slate-600">{selectedStaffMember.bio}</div>
            ) : null}

            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              {dateOptions.map((dateKey) => {
                const active = selectedDate === dateKey;
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    className={`min-w-[120px] rounded-[24px] px-4 py-4 text-left transition ${
                      active ? "bg-slate-950 text-white shadow-[0_20px_36px_-26px_rgba(15,23,42,0.8)]" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.18em] opacity-70">Data</p>
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

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { title: "Servico", done: Boolean(selectedServiceId) },
                  { title: "Horario", done: Boolean(selectedSlot) },
                  { title: "Dados", done: Boolean(name && whatsapp && policyAccepted) }
                ].map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-slate-200/70 bg-white/70 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.done ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                <div className="rounded-[24px] bg-slate-50/90 px-4 py-4">
                  <p className="text-sm font-medium text-slate-500">Servico</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{selectedService?.name ?? "Selecione um servico"}</p>
                  <p className="mt-2 text-sm text-slate-500">{selectedService ? formatCurrency(selectedService.priceValue) : "Preco exibido apos escolha"}</p>
                </div>
                <div className="rounded-[24px] bg-slate-50/90 px-4 py-4">
                  <p className="text-sm font-medium text-slate-500">Horario</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{selectedSlot ? formatDateTime(selectedSlot) : "Escolha um horario"}</p>
                  <p className="mt-2 text-sm text-slate-500">{selectedStaffMember?.name ?? selectedSlotStaff?.name ?? "Profissional definido na selecao do slot"}</p>
                </div>
                {selectedService?.depositEnabled ? (
                  <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4">
                    <p className="text-sm font-semibold text-amber-800">Este servico aceita sinal via Pix</p>
                    <p className="mt-2 text-sm text-amber-700">Valor previsto do sinal: {formatCurrency(selectedService.depositAmount)}</p>
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
                <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Pix copia e cola</p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">{result.payment.pixCopyPaste}</p>
                      {result.payment.ticketUrl ? (
                        <a
                          className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]"
                          href={result.payment.ticketUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Abrir comprovante/QR em nova aba
                        </a>
                      ) : null}
                    </div>
                    {result.payment.qrCode ? (
                      <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
                        <img
                          alt="QR Code Pix do sinal"
                          className="h-36 w-36 rounded-[18px] object-contain"
                          src={result.payment.qrCode}
                        />
                      </div>
                    ) : null}
                    <div className="sm:self-start">
                      <Button variant="secondary" size="sm" onClick={copyPixCode}>
                        {copiedPix ? "Codigo copiado" : "Copiar codigo"}
                      </Button>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    ID do pagamento: {result.payment.externalId}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Expira em {result.payment.expiresAt ? formatDateTime(result.payment.expiresAt) : "breve"}.
                  </p>
                </div>
              ) : null}
            </Card>
          ) : (
            <Card className="px-6 py-6 sm:px-8">
              <SectionTag>Etapa 3</SectionTag>
              <form className="mt-5 space-y-4" onSubmit={onSubmit}>
                <Field label="Nome" hint="Obrigatorio">
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
                  className="w-full"
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
                </Button>

                <p className="text-center text-xs leading-6 text-slate-400">
                  Ao confirmar, voce recebe os detalhes do horario e, se houver sinal, o codigo Pix para concluir a reserva.
                </p>
              </form>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
