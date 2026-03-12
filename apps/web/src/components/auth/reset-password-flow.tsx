"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Input } from "@belezafoco/ui";
import {
  postJson,
  toRelativeInternalUrl
} from "@/lib/browser-auth";
import { AuthFeedback } from "./auth-feedback";

export function ResetPasswordFlow({ token }: { token: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [feedback, setFeedback] = useState<{
    actionUrl?: string | null;
    message: string | null;
    tone: "danger" | "success";
  }>({
    message: null,
    tone: "success"
  });
  const [isPending, startTransition] = useTransition();

  function handleRequestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const payload = await postJson<{ previewUrl?: string }>("/api/auth/request-password-reset", {
          email
        });
        setFeedback({
          actionUrl: toRelativeInternalUrl(payload.previewUrl),
          message: "Se o e-mail existir, enviamos um link seguro para redefinicao.",
          tone: "success"
        });
      } catch (error) {
        setFeedback({
          actionUrl: null,
          message: error instanceof Error ? error.message : "Nao foi possivel solicitar a redefinicao.",
          tone: "danger"
        });
      }
    });
  }

  function handleCompleteReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    startTransition(async () => {
      try {
        await postJson("/api/auth/reset-password", {
          token,
          nextPassword
        });
        setFeedback({
          actionUrl: null,
          message: "Senha redefinida. Redirecionando para o app...",
          tone: "success"
        });
        router.push("/app");
        router.refresh();
      } catch (error) {
        setFeedback({
          actionUrl: null,
          message: error instanceof Error ? error.message : "Nao foi possivel redefinir a senha.",
          tone: "danger"
        });
      }
    });
  }

  return (
    <div className="mt-8 space-y-5">
      {token ? (
        <form className="space-y-5" onSubmit={handleCompleteReset}>
          <div className="space-y-2">
            <label htmlFor="next-password" className="text-sm font-semibold text-slate-700">
              Nova senha
            </label>
            <Input
              id="next-password"
              type="password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              placeholder="Crie uma senha forte"
              minLength={8}
              required
            />
          </div>
          <Button className="w-full" disabled={isPending}>
            {isPending ? "Aplicando nova senha..." : "Definir nova senha"}
          </Button>
        </form>
      ) : (
        <form className="space-y-5" onSubmit={handleRequestReset}>
          <div className="space-y-2">
            <label htmlFor="reset-email" className="text-sm font-semibold text-slate-700">
              E-mail da conta
            </label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@studio.com"
              required
            />
          </div>
          <Button className="w-full" disabled={isPending}>
            {isPending ? "Enviando link..." : "Enviar link de redefinicao"}
          </Button>
        </form>
      )}

      <AuthFeedback message={feedback.message} tone={feedback.tone} />

      {feedback.actionUrl ? (
        <Link
          href={feedback.actionUrl}
          className="inline-flex text-sm font-semibold text-[color:var(--color-accent)]"
        >
          Abrir link de redefinicao desta sessao
        </Link>
      ) : null}
    </div>
  );
}
