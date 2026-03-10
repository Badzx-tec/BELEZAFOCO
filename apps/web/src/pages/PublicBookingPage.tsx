import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { z } from "zod/v3";
import { Badge, Button, Card, EmptyState, Field, Input, SectionTitle, Skeleton, TextArea } from "../components/ui";
import { api } from "../lib/api";
import { currencyInCents, readableError } from "../lib/format";

type PublicWorkspace = {
  workspace: {
    name: string;
    slug: string;
    address?: string | null;
    whatsapp?: string | null;
    about?: string | null;
    brandPrimary: string;
    brandAccent: string;
    bookingPolicy?: string | null;
    publicBookingEnabled: boolean;
  };
  services: Array<{
    id: string;
    name: string;
    category: string;
    description?: string | null;
    durationMinutes: number;
    priceValue?: number | null;
    featured: boolean;
    depositEnabled: boolean;
  }>;
  staffMembers: Array<{
    id: string;
    name: string;
    staffServices: Array<{ serviceId: string }>;
  }>;
};

type SlotsResponse = {
  staffMemberId: string;
  slots: string[];
};

type BookingResponse = {
  appointmentId: string;
  status: string;
  payment?: { pixCopyPaste: string };
};

const bookingSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome."),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp valido."),
  email: z.union([z.literal(""), z.string().email("Informe um e-mail valido.")]),
  notesClient: z.string().trim().max(300, "Use no maximo 300 caracteres."),
  whatsappOptIn: z.boolean(),
  policyAccepted: z.boolean().refine((value) => value, "Aceite a politica de agendamento.")
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const defaultBookingValues: BookingFormValues = {
  name: "",
  whatsapp: "",
  email: "",
  notesClient: "",
  whatsappOptIn: true,
  policyAccepted: false
};

export function PublicBookingPage() {
  const { slug = "demo-beleza" } = useParams();
  const [serviceId, setServiceId] = useState("");
  const [staffMemberId, setStaffMemberId] = useState("");
  const [date, setDate] = useState(nextAvailableDate());
  const [selectedSlot, setSelectedSlot] = useState("");
  const [success, setSuccess] = useState<BookingResponse | null>(null);
  const bookingForm = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: defaultBookingValues
  });
  const customerWhatsapp = bookingForm.watch("whatsapp");
  const policyAccepted = bookingForm.watch("policyAccepted");

  useEffect(() => {
    setServiceId("");
    setStaffMemberId("");
    setSelectedSlot("");
    setSuccess(null);
    setDate(nextAvailableDate());
    bookingForm.reset(defaultBookingValues);
  }, [bookingForm, slug]);

  const workspaceQuery = useQuery({
    queryKey: ["public-workspace", slug],
    queryFn: () => api<PublicWorkspace>(`/public/b/${slug}`)
  });

  const data = workspaceQuery.data ?? null;
  const selectedService = data?.services.find((service) => service.id === serviceId) ?? null;
  const availableStaff = useMemo(
    () => (data?.staffMembers ?? []).filter((member) => !serviceId || member.staffServices.some((service) => service.serviceId === serviceId)),
    [data?.staffMembers, serviceId]
  );

  useEffect(() => {
    if (!serviceId && data?.services[0]) {
      setServiceId(data.services[0].id);
    }
  }, [data?.services, serviceId]);

  useEffect(() => {
    if (staffMemberId && !availableStaff.some((member) => member.id === staffMemberId)) {
      setStaffMemberId("");
    }
  }, [availableStaff, staffMemberId]);

  useEffect(() => {
    setSelectedSlot("");
    setSuccess(null);
  }, [date, serviceId, staffMemberId]);

  const slotsQuery = useQuery({
    queryKey: ["public-slots", slug, serviceId, staffMemberId, date],
    enabled: Boolean(serviceId),
    queryFn: async () => {
      const query = new URLSearchParams({
        serviceId,
        date
      });
      if (staffMemberId) {
        query.set("staffMemberId", staffMemberId);
      }
      return api<SlotsResponse>(`/public/b/${slug}/slots?${query.toString()}`);
    }
  });

  useEffect(() => {
    if (slotsQuery.data?.staffMemberId && slotsQuery.data.staffMemberId !== staffMemberId) {
      setStaffMemberId(slotsQuery.data.staffMemberId);
    }
  }, [slotsQuery.data?.staffMemberId, staffMemberId]);

  const bookingMutation = useMutation({
    mutationFn: async (values: BookingFormValues) => {
      return api<BookingResponse>(`/public/b/${slug}/book`, {
        method: "POST",
        headers: {
          "x-idempotency-key": `booking:${slug}:${serviceId}:${staffMemberId}:${selectedSlot}:${values.whatsapp}`
        },
        body: JSON.stringify({
          serviceId,
          staffMemberId,
          startAt: selectedSlot,
          name: values.name,
          whatsapp: values.whatsapp,
          email: values.email || undefined,
          notesClient: values.notesClient || undefined,
          whatsappOptIn: values.whatsappOptIn,
          policyAccepted: values.policyAccepted
        })
      });
    },
    onSuccess(response) {
      setSuccess(response);
    }
  });

  const submitBooking = bookingForm.handleSubmit(async (values) => {
    if (!selectedSlot || !serviceId) return;
    await bookingMutation.mutateAsync(values);
  });

  const error =
    (bookingMutation.error ? readableError(bookingMutation.error) : "") ||
    (slotsQuery.error ? readableError(slotsQuery.error) : "") ||
    (workspaceQuery.error ? readableError(workspaceQuery.error) : "");

  const slots = slotsQuery.data?.slots ?? [];

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(196,139,90,0.28),_transparent_30%),linear-gradient(180deg,#fffdf9_0%,#f7f2e8_100%)]"
      style={{ ["--brand-primary" as string]: data?.workspace.brandPrimary ?? "#111827", ["--brand-accent" as string]: data?.workspace.brandAccent ?? "#c48b5a" }}
    >
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-8 md:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <Card className="overflow-hidden bg-slate-950 text-white">
          {workspaceQuery.isLoading || !data ? (
            <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-28" /><Skeleton className="h-20" /></div>
          ) : (
            <div className="relative space-y-7">
              <div className="absolute inset-y-0 right-0 w-40 rounded-full blur-3xl" style={{ backgroundColor: `${data.workspace.brandAccent}59` }} />
              <Badge tone="warning">Agendamento online</Badge>
              <div className="relative space-y-4">
                <h1 className="font-display text-5xl">{data.workspace.name}</h1>
                <p className="max-w-xl text-sm leading-7 text-white/72">{data.workspace.about || "Reserve seu horario em poucos toques, sem cadastro complicado e com confirmacao clara."}</p>
                <div className="grid gap-3 text-sm text-white/70">
                  <div className="rounded-2xl bg-white/8 px-4 py-3">Escolha servico, profissional e horario no mesmo fluxo.</div>
                  <div className="rounded-2xl bg-white/8 px-4 py-3">Confirme politicas e, se necessario, siga para o sinal via Pix.</div>
                  {data.workspace.address ? <div className="rounded-2xl bg-white/8 px-4 py-3">{data.workspace.address}</div> : null}
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="space-y-6">
          <SectionTitle eyebrow="Reserva" title="Escolha seu horario" description="Fluxo curto, visual limpo e pronto para celular." />

          {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p> : null}

          {success ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Reserva criada</p>
                <h3 className="text-2xl font-semibold text-slate-900">Agendamento confirmado no sistema.</h3>
                <p className="text-sm leading-6 text-slate-600">Codigo {success.appointmentId}. Status {success.status}.</p>
                {success.payment ? (
                  <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-600">
                    Pix copia e cola: <span className="font-semibold text-slate-900">{success.payment.pixCopyPaste}</span>
                  </div>
                ) : null}
              </div>
            </Card>
          ) : (
            <form className="space-y-6" onSubmit={submitBooking}>
              <div className="space-y-4">
                <Field as="fieldset" label="1. Escolha o servico">
                  <div className="grid gap-3">
                    {(data?.services ?? []).map((service) => (
                      <button
                        key={service.id}
                        aria-pressed={service.id === serviceId}
                        className={`rounded-3xl border px-4 py-4 text-left transition ${service.id === serviceId ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-900"}`}
                        onClick={() => setServiceId(service.id)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">{service.name}</p>
                            <p className={`mt-2 text-sm ${service.id === serviceId ? "text-white/70" : "text-slate-500"}`}>{service.category} - {service.durationMinutes} min</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{currencyInCents(service.priceValue ?? 0)}</p>
                            {service.depositEnabled ? <p className={`mt-2 text-xs uppercase tracking-[0.24em] ${service.id === serviceId ? "text-amber-200" : "text-emerald-700"}`}>Sinal via Pix</p> : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field as="fieldset" label="2. Profissional">
                    <div className="grid gap-2">
                      {availableStaff.map((member) => (
                        <button
                          key={member.id}
                          aria-pressed={member.id === staffMemberId}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${member.id === staffMemberId ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}
                          onClick={() => setStaffMemberId(member.id)}
                          type="button"
                        >
                          {member.name}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="3. Data">
                    <Input min={nextAvailableDate()} name="bookingDate" required type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                  </Field>
                </div>

                <Field as="fieldset" hint={selectedService ? `${selectedService.durationMinutes} min` : undefined} label="4. Horarios disponiveis">
                  {slotsQuery.isLoading || slotsQuery.isFetching ? (
                    <div className="grid gap-3 md:grid-cols-3"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
                  ) : slots.length === 0 ? (
                    <EmptyState title="Nenhum horario livre nesta data" description="Troque a data ou o profissional para ver outras opcoes." />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-3">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          aria-pressed={slot === selectedSlot}
                          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${slot === selectedSlot ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}
                          onClick={() => setSelectedSlot(slot)}
                          type="button"
                        >
                          {new Date(slot).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </button>
                      ))}
                    </div>
                  )}
                </Field>
              </div>

              <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <SectionTitle eyebrow="Seus dados" title="Finalize a reserva" description="Coletamos apenas o necessario para confirmar o atendimento." />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field error={bookingForm.formState.errors.name?.message} label="Nome">
                    <Input autoComplete="name" disabled={bookingMutation.isPending} required {...bookingForm.register("name")} />
                  </Field>
                  <Field error={bookingForm.formState.errors.whatsapp?.message} label="WhatsApp">
                    <Input autoComplete="tel" disabled={bookingMutation.isPending} inputMode="tel" required {...bookingForm.register("whatsapp")} />
                  </Field>
                </div>
                <Field error={bookingForm.formState.errors.email?.message} label="E-mail">
                  <Input autoComplete="email" disabled={bookingMutation.isPending} inputMode="email" type="email" {...bookingForm.register("email")} />
                </Field>
                <Field error={bookingForm.formState.errors.notesClient?.message} label="Observacoes">
                  <TextArea disabled={bookingMutation.isPending} {...bookingForm.register("notesClient")} />
                </Field>
                <label className="flex items-start gap-3 text-sm text-slate-600" htmlFor="booking-whatsapp-opt-in">
                  <input className="mt-1 h-4 w-4 accent-slate-950" disabled={bookingMutation.isPending} id="booking-whatsapp-opt-in" type="checkbox" {...bookingForm.register("whatsappOptIn")} />
                  Aceito receber lembretes e confirmacoes no WhatsApp.
                </label>
                <label className="flex items-start gap-3 text-sm text-slate-600" htmlFor="booking-policy-accepted">
                  <input className="mt-1 h-4 w-4 accent-slate-950" disabled={bookingMutation.isPending} id="booking-policy-accepted" type="checkbox" {...bookingForm.register("policyAccepted")} />
                  Li e aceito a politica de agendamento{data?.workspace.bookingPolicy ? `: ${data.workspace.bookingPolicy}` : "."}
                </label>
                {bookingForm.formState.errors.policyAccepted?.message ? (
                  <p className="text-xs font-medium text-rose-700" role="alert">{bookingForm.formState.errors.policyAccepted.message}</p>
                ) : null}
                <Button className="w-full" disabled={!selectedSlot || !policyAccepted || bookingMutation.isPending || !customerWhatsapp} type="submit">
                  {bookingMutation.isPending ? "Confirmando..." : "Confirmar agendamento"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

function nextAvailableDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
