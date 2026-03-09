import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, SectionTag, SkeletonBlock } from "../components/ui";
import { api } from "../lib/api";
import { formatCurrency, formatDateLabel, formatDateTime, formatTime, nextDateKeys } from "../lib/format";

type PublicWorkspaceData = {
  workspace: {
    name: string;
    slug: string;
    address: string | null;
    whatsapp: string | null;
    logoUrl: string | null;
    description: string | null;
    bookingPolicy: string | null;
    brandPrimaryColor: string;
    brandAccentColor: string;
  };
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
    expiresAt: string | null;
  } | null;
};

const dateOptions = nextDateKeys(7);

export function PublicBookingPage() {
  const { slug = "demo-beleza" } = useParams();
  const [data, setData] = useState<PublicWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]);
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

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api<PublicWorkspaceData>(`/public/b/${slug}`)
      .then((payload) => {
        if (!active) return;
        setData(payload);
        setSelectedServiceId((current) => current || payload.services[0]?.id || "");
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
    return data.staffMembers.filter((staff) => staff.serviceIds.includes(selectedServiceId));
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
    setSelectedSlot("");

    const query = new URLSearchParams({
      serviceId: selectedServiceId,
      date: selectedDate,
      ...(selectedStaffId ? { staffMemberId: selectedStaffId } : {})
    });

    api<SlotPayload>(`/public/b/${slug}/slots?${query.toString()}`)
      .then((payload) => {
        if (!active) return;
        setSlots(payload);
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

  const selectedService = data?.services.find((service) => service.id === selectedServiceId) ?? null;
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
          staffMemberId: selectedStaffId || slots?.slots.find((item) => item.startAt === selectedSlot)?.staffMemberId,
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

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <SkeletonBlock className="h-[540px]" />
          <SkeletonBlock className="h-[540px]" />
        </div>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Card className="px-6 py-6 text-center">
          <SectionTag>Agendamento público</SectionTag>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">Não foi possível carregar a página.</h1>
          <p className="mt-3 text-sm text-slate-500">{error ?? "Verifique o slug público e tente novamente."}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8" style={brandStyle}>
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <Card className="overflow-hidden px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <SectionTag>Agendamento online</SectionTag>
                <h1 className="mt-4 text-4xl font-semibold text-slate-950">{data.workspace.name}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{data.workspace.description}</p>
              </div>
              <div className="rounded-[28px] px-5 py-4 text-right text-white" style={{ backgroundColor: data.workspace.brandPrimaryColor }}>
                <p className="text-xs uppercase tracking-[0.28em] text-white/70">Atendimento</p>
                <p className="mt-3 text-2xl font-semibold">{data.workspace.whatsapp ?? "WhatsApp ativo"}</p>
                <p className="mt-2 text-sm text-white/75">{data.workspace.address ?? "Endereço informado no onboarding"}</p>
              </div>
            </div>
          </Card>

          <Card className="px-6 py-6 sm:px-8">
            <SectionTag>1. Escolha o serviço</SectionTag>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {data.services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`rounded-[28px] border px-5 py-5 text-left transition ${
                    selectedServiceId === service.id
                      ? "border-slate-950 bg-slate-950 text-white shadow-[0_22px_50px_-30px_rgba(15,23,42,0.75)]"
                      : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{service.category}</p>
                      <p className={`mt-3 text-xl font-semibold ${selectedServiceId === service.id ? "text-white" : "text-slate-950"}`}>{service.name}</p>
                    </div>
                    {service.featured ? (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedServiceId === service.id ? "bg-white/15 text-white" : "bg-amber-50 text-amber-700"}`}>
                        Destaque
                      </span>
                    ) : null}
                  </div>
                  <p className={`mt-3 text-sm leading-7 ${selectedServiceId === service.id ? "text-slate-200" : "text-slate-500"}`}>
                    {service.description}
                  </p>
                  <div className={`mt-4 flex flex-wrap gap-2 text-sm ${selectedServiceId === service.id ? "text-slate-200" : "text-slate-600"}`}>
                    <span className="rounded-full bg-black/5 px-3 py-2">{service.durationMinutes} min</span>
                    <span className="rounded-full bg-black/5 px-3 py-2">{formatCurrency(service.priceValue)}</span>
                    {service.depositEnabled ? <span className="rounded-full bg-black/5 px-3 py-2">Sinal {formatCurrency(service.depositAmount)}</span> : null}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="px-6 py-6 sm:px-8">
            <SectionTag>2. Profissional e horário</SectionTag>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedStaffId === "" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}
                onClick={() => setSelectedStaffId("")}
              >
                Melhor disponível
              </button>
              {availableStaff.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaffId(staff.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedStaffId === staff.id ? "text-white" : "text-slate-700"}`}
                  style={{ backgroundColor: selectedStaffId === staff.id ? staff.colorHex : "#e2e8f0" }}
                >
                  {staff.name}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              {dateOptions.map((dateKey) => (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`min-w-[104px] rounded-[24px] px-4 py-4 text-left transition ${selectedDate === dateKey ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  <p className="text-xs uppercase tracking-[0.18em] opacity-70">Data</p>
                  <p className="mt-2 text-sm font-semibold">{formatDateLabel(dateKey)}</p>
                </button>
              ))}
            </div>

            <div className="mt-6">
              {slotsLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <SkeletonBlock key={index} className="h-14 rounded-[18px]" />
                  ))}
                </div>
              ) : slotsError ? (
                <div className="rounded-[24px] bg-rose-50 px-4 py-4 text-sm text-rose-700">{slotsError}</div>
              ) : slots?.slots.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {slots.slots.map((slot) => {
                    const active = selectedSlot === slot.startAt;
                    const staff = data.staffMembers.find((item) => item.id === slot.staffMemberId);
                    return (
                      <button
                        key={`${slot.staffMemberId}-${slot.startAt}`}
                        onClick={() => {
                          setSelectedSlot(slot.startAt);
                          setSelectedStaffId(slot.staffMemberId);
                        }}
                        className={`rounded-[20px] border px-3 py-3 text-left transition ${active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white"}`}
                      >
                        <p className="text-lg font-semibold">{formatTime(slot.startAt)}</p>
                        <p className={`mt-1 text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>{staff?.name ?? "Disponível"}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-5">
                  <p className="text-lg font-semibold text-slate-900">Sem horários abertos nessa combinação.</p>
                  <p className="mt-2 text-sm text-slate-500">Troque a data ou use “melhor disponível” para ampliar a agenda exibida.</p>
                </div>
              )}
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <Card className="px-6 py-6 sm:px-8">
            <SectionTag>3. Seus dados</SectionTag>
            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4">
                <label className="text-sm font-medium text-slate-700">
                  Nome
                  <input
                    className="mt-2 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Como devemos te chamar?"
                    required
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  WhatsApp
                  <input
                    className="mt-2 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    value={whatsapp}
                    onChange={(event) => setWhatsapp(event.target.value)}
                    placeholder="+55"
                    required
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  E-mail
                  <input
                    className="mt-2 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Opcional"
                    type="email"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Observações
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Preferência de atendimento, observação rápida ou referência."
                  />
                </label>
              </div>

              <label className="flex gap-3 rounded-[22px] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <input type="checkbox" checked={policyAccepted} onChange={(event) => setPolicyAccepted(event.target.checked)} className="mt-1" />
                <span>
                  Li e aceito a política do agendamento.
                  <span className="mt-2 block text-slate-500">{data.workspace.bookingPolicy ?? "Cancelamentos e reagendamentos seguem a política definida pelo negócio."}</span>
                </span>
              </label>

              {submitError ? <div className="rounded-[20px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div> : null}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  submitting ||
                  !selectedService ||
                  !selectedSlot ||
                  !name ||
                  !whatsapp ||
                  !policyAccepted ||
                  (selectedStaffId === "" && !slots?.slots.some((item) => item.startAt === selectedSlot))
                }
              >
                {submitting ? "Confirmando..." : "Confirmar agendamento"}
              </Button>
            </form>
          </Card>

          <Card className="px-6 py-6 sm:px-8">
            <SectionTag>Resumo</SectionTag>
            <div className="mt-5 space-y-4">
              <div className="rounded-[24px] bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-500">Serviço</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{selectedService?.name ?? "Selecione um serviço"}</p>
                <p className="mt-2 text-sm text-slate-500">{selectedService ? formatCurrency(selectedService.priceValue) : "Preço exibido após escolha"}</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-500">Horário</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{selectedSlot ? formatDateTime(selectedSlot) : "Escolha um horário"}</p>
              </div>
              {selectedService?.depositEnabled ? (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4">
                  <p className="text-sm font-semibold text-amber-800">Este serviço aceita sinal via Pix</p>
                  <p className="mt-2 text-sm text-amber-700">Valor previsto do sinal: {formatCurrency(selectedService.depositAmount)}</p>
                </div>
              ) : null}
            </div>
          </Card>

          {result ? (
            <Card className="px-6 py-6 sm:px-8">
              <SectionTag>{result.status === "pending_payment" ? "Reserva iniciada" : "Agendamento confirmado"}</SectionTag>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950">
                {result.status === "pending_payment" ? "Falta só concluir o Pix." : "Seu horário foi reservado com sucesso."}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Código do agendamento: <strong>{result.appointmentId}</strong>
              </p>

              {result.payment ? (
                <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 px-5 py-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Pix copia e cola</p>
                  <p className="mt-3 break-all text-sm leading-7 text-slate-700">{result.payment.pixCopyPaste}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Expira em {result.payment.expiresAt ? formatDateTime(result.payment.expiresAt) : "breve"}.
                  </p>
                </div>
              ) : null}
            </Card>
          ) : null}
        </section>
      </div>
    </div>
  );
}
