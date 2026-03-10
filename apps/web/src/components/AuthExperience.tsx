import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v3";
import { api, type Session } from "../lib/api";
import { readableError } from "../lib/format";
import { Button, Card, Field, Input, SectionTitle } from "./ui";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome."),
  workspaceName: z.string().trim().min(1, "Informe o nome do negocio."),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp valido."),
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(8, "Use pelo menos 8 caracteres.")
});

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe sua senha.")
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

export function AuthExperience({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      workspaceName: "",
      whatsapp: "",
      email: "",
      password: ""
    }
  });
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  const mutation = useMutation({
    mutationFn: async (values: RegisterFormValues | LoginFormValues) => {
      return api<Session>(mode === "register" ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(values)
      });
    },
    onSuccess(session) {
      onAuthenticated(session);
    }
  });

  const submitRegister = registerForm.handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });
  const submitLogin = loginForm.handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  function switchMode(nextMode: "register" | "login") {
    mutation.reset();
    setMode(nextMode);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(196,139,90,0.28),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.12),_transparent_32%),linear-gradient(180deg,#fcfaf6_0%,#f7f1e6_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <Card className="overflow-hidden bg-slate-950 text-white">
          <div className="relative space-y-8">
            <div className="absolute inset-y-0 right-0 w-48 rounded-full blur-3xl" style={{ backgroundColor: "rgba(196, 139, 90, 0.4)" }} />
            <div className="relative space-y-4">
              <p className="text-xs uppercase tracking-[0.32em] text-white/50">BELEZAFOCO</p>
              <h1 className="font-display text-5xl leading-tight">Agenda, WhatsApp e Pix para o mercado local de beleza.</h1>
              <p className="max-w-2xl text-base leading-8 text-white/72">
                Crie um workspace profissional, publique o link de agendamento e organize a operacao diaria sem planilha, sem confirmacao manual e sem cara de sistema antigo.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Agenda com conflito bloqueado", body: "Profissionais, buffers e recursos no mesmo fluxo." },
                { title: "Booking publico premium", body: "Compartilhe no WhatsApp, Instagram e Google." },
                { title: "Sinal via Pix", body: "Base pronta para pagamento e conciliacao." }
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/6 p-4">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-3 text-sm leading-6 text-white/65">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-6">
          <div className="flex rounded-full bg-slate-100 p-1">
            <button className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${mode === "register" ? "bg-white text-slate-950 shadow-soft" : "text-slate-500"}`} onClick={() => switchMode("register")} type="button">
              Criar teste gratis
            </button>
            <button className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${mode === "login" ? "bg-white text-slate-950 shadow-soft" : "text-slate-500"}`} onClick={() => switchMode("login")} type="button">
              Entrar
            </button>
          </div>

          <SectionTitle
            eyebrow={mode === "register" ? "Onboarding rapido" : "Acesso"}
            title={mode === "register" ? "Configure seu workspace" : "Retome sua operacao"}
            description={mode === "register" ? "Nome do negocio, dono e WhatsApp. O restante voce ajusta no painel." : "Use seu e-mail e senha para voltar ao cockpit do workspace."}
          />

          {mode === "register" ? (
            <form className="space-y-4" onSubmit={submitRegister}>
              <Field error={registerForm.formState.errors.name?.message} label="Seu nome">
                <Input autoComplete="name" disabled={mutation.isPending} required {...registerForm.register("name")} />
              </Field>
              <Field error={registerForm.formState.errors.workspaceName?.message} label="Nome do negocio">
                <Input autoComplete="organization" disabled={mutation.isPending} required {...registerForm.register("workspaceName")} />
              </Field>
              <Field error={registerForm.formState.errors.whatsapp?.message} label="WhatsApp">
                <Input autoComplete="tel" disabled={mutation.isPending} inputMode="tel" required {...registerForm.register("whatsapp")} />
              </Field>
              <Field error={registerForm.formState.errors.email?.message} label="E-mail">
                <Input autoComplete="email" disabled={mutation.isPending} inputMode="email" required type="email" {...registerForm.register("email")} />
              </Field>
              <Field error={registerForm.formState.errors.password?.message} label="Senha">
                <Input autoComplete="new-password" disabled={mutation.isPending} required type="password" {...registerForm.register("password")} />
              </Field>

              {mutation.error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{readableError(mutation.error)}</p> : null}

              <Button className="w-full" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? "Processando..." : "Criar workspace"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={submitLogin}>
              <Field error={loginForm.formState.errors.email?.message} label="E-mail">
                <Input autoComplete="email" disabled={mutation.isPending} inputMode="email" required type="email" {...loginForm.register("email")} />
              </Field>
              <Field error={loginForm.formState.errors.password?.message} label="Senha">
                <Input autoComplete="current-password" disabled={mutation.isPending} required type="password" {...loginForm.register("password")} />
              </Field>

              {mutation.error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{readableError(mutation.error)}</p> : null}

              <Button className="w-full" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? "Processando..." : "Entrar no painel"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
