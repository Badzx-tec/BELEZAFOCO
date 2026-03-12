"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button, Input } from "@belezafoco/ui";
import {
  postJson
} from "@/lib/browser-auth";
import { AuthFeedback } from "./auth-feedback";
import { GoogleAuthButton } from "./google-auth-button";

export function LoginForm({
  googleAllowedOrigins,
  googleClientId
}: {
  googleAllowedOrigins: string[];
  googleClientId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<{ message: string | null; tone: "danger" | "success" }>({
    message: null,
    tone: "success"
  });
  const [isPending, startTransition] = useTransition();
  const normalizedAllowedOrigins = useMemo(
    () => googleAllowedOrigins.filter(Boolean),
    [googleAllowedOrigins]
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        await postJson("/api/auth/login", {
          email,
          password
        });
        setFeedback({ message: null, tone: "success" });
        router.push("/app");
        router.refresh();
      } catch (error) {
        setFeedback({
          message: error instanceof Error ? error.message : "Nao foi possivel entrar.",
          tone: "danger"
        });
      }
    });
  }

  return (
    <>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-slate-700">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@studio.com"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-semibold text-slate-700">
            Senha
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            minLength={8}
            required
          />
        </div>
        <Button className="w-full" disabled={isPending}>
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>ou</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <GoogleAuthButton
          allowedOrigins={normalizedAllowedOrigins}
          clientId={googleClientId}
          intent="login"
          onSuccess={() => {
            router.push("/app");
            router.refresh();
          }}
        />
      </div>

      <div className="mt-5">
        <AuthFeedback message={feedback.message} tone={feedback.tone} />
      </div>

      <div className="mt-6 flex items-center justify-between text-sm font-medium text-slate-500">
        <Link href="/redefinir-senha" className="hover:text-slate-950">
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="hover:text-slate-950">
          Criar conta
        </Link>
      </div>
    </>
  );
}
