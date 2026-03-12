"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button, Input } from "@belezafoco/ui";
import {
  postJson,
  toRelativeInternalUrl
} from "@/lib/browser-auth";
import { AuthFeedback } from "./auth-feedback";
import { GoogleAuthButton } from "./google-auth-button";

interface RegisterResponse {
  verificationTokenPreview?: string;
  verificationUrlPreview?: string;
}

export function RegisterForm({
  googleAllowedOrigins,
  googleClientId
}: {
  googleAllowedOrigins: string[];
  googleClientId: string;
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [feedback, setFeedback] = useState<{ message: string | null; tone: "danger" | "success" }>({
    message: null,
    tone: "success"
  });
  const [isPending, startTransition] = useTransition();
  const normalizedAllowedOrigins = useMemo(
    () => googleAllowedOrigins.filter(Boolean),
    [googleAllowedOrigins]
  );

  function routeAfterEmailRegister(payload?: RegisterResponse) {
    const relativePreviewUrl = toRelativeInternalUrl(payload?.verificationUrlPreview);
    if (relativePreviewUrl) {
      router.push(relativePreviewUrl);
      return;
    }

    router.push(`/verificar-email?email=${encodeURIComponent(email)}`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const payload = await postJson<RegisterResponse>("/api/auth/register", {
          businessName,
          fullName,
          email,
          password,
          phone
        });
        setFeedback({
          message: "Workspace criado. Confira a caixa de entrada para confirmar o e-mail.",
          tone: "success"
        });
        routeAfterEmailRegister(payload);
      } catch (error) {
        setFeedback({
          message: error instanceof Error ? error.message : "Nao foi possivel criar a conta.",
          tone: "danger"
        });
      }
    });
  }

  return (
    <>
      <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="workspace" className="text-sm font-semibold text-slate-700">
            Nome do negocio
          </label>
          <Input
            id="workspace"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="Studio Jardins"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="owner-name" className="text-sm font-semibold text-slate-700">
            Seu nome
          </label>
          <Input
            id="owner-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Juan Nicarosa"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="owner-email" className="text-sm font-semibold text-slate-700">
            E-mail
          </label>
          <Input
            id="owner-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@studio.com"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="owner-password" className="text-sm font-semibold text-slate-700">
            Senha
          </label>
          <Input
            id="owner-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Crie uma senha forte"
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="owner-phone" className="text-sm font-semibold text-slate-700">
            WhatsApp
          </label>
          <Input
            id="owner-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div className="space-y-4 md:col-span-2">
          <Button className="w-full" disabled={isPending}>
            {isPending ? "Criando workspace..." : "Criar workspace"}
          </Button>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>ou</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <GoogleAuthButton
            allowedOrigins={normalizedAllowedOrigins}
            clientId={googleClientId}
            intent="register"
            buildPayload={() => ({
              businessName,
              fullName,
              phone
            })}
            onSuccess={() => {
              router.push("/app/onboarding");
              router.refresh();
            }}
          />
        </div>
      </form>

      <div className="mt-5">
        <AuthFeedback message={feedback.message} tone={feedback.tone} />
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Ao continuar voce concorda com os termos comerciais e com a verificacao de email obrigatoria.
      </p>
      <Link
        href="/login"
        className="mt-3 inline-block text-sm font-semibold text-slate-700 hover:text-slate-950"
      >
        Ja tem conta? Entrar
      </Link>
    </>
  );
}
