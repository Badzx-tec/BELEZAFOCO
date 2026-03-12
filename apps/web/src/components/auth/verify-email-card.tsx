"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Button, Input } from "@belezafoco/ui";
import { postJson, toRelativeInternalUrl } from "@/lib/browser-auth";
import { AuthFeedback } from "./auth-feedback";

export function VerifyEmailCard({ token }: { token: string | null }) {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<{
    actionUrl?: string | null;
    message: string | null;
    tone: "danger" | "success";
  }>({
    message: token ? "Validando seu link seguro..." : null,
    tone: "success"
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!token) {
      return;
    }

    startTransition(async () => {
      try {
        await postJson("/api/auth/verify-email", { token });
        setFeedback({
          actionUrl: "/app/onboarding",
          message: "E-mail confirmado com sucesso. Seu onboarding ja pode continuar.",
          tone: "success"
        });
      } catch (error) {
        setFeedback({
          actionUrl: null,
          message: error instanceof Error ? error.message : "Nao foi possivel validar o link.",
          tone: "danger"
        });
      }
    });
  }, [token]);

  function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const payload = await postJson<{ previewUrl?: string }>("/api/auth/resend-verification", {
          email
        });
        setFeedback({
          actionUrl: toRelativeInternalUrl(payload.previewUrl),
          message: "Se a conta existir e ainda nao estiver verificada, enviamos um novo link.",
          tone: "success"
        });
      } catch (error) {
        setFeedback({
          actionUrl: null,
          message: error instanceof Error ? error.message : "Nao foi possivel reenviar o link.",
          tone: "danger"
        });
      }
    });
  }

  return (
    <div className="mt-6 space-y-5">
      <AuthFeedback message={feedback.message} tone={feedback.tone} />

      {feedback.actionUrl ? (
        <Link
          href={feedback.actionUrl}
          className="inline-flex text-sm font-semibold text-[color:var(--color-accent)]"
        >
          Continuar agora
        </Link>
      ) : null}

      {!token ? (
        <form className="space-y-4 text-left" onSubmit={handleResend}>
          <div className="space-y-2">
            <label htmlFor="verify-email" className="text-sm font-semibold text-slate-700">
              Reenviar para este e-mail
            </label>
            <Input
              id="verify-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@studio.com"
              required
            />
          </div>
          <Button className="w-full" disabled={isPending}>
            {isPending ? "Reenviando..." : "Reenviar link"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
