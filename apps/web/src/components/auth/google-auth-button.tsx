"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@belezafoco/ui";
import {
  ensureClientToken,
  postJson
} from "@/lib/browser-auth";
import { AuthFeedback } from "./auth-feedback";

const GOOGLE_CSRF_COOKIE = "bf_google_csrf";

interface GoogleAuthButtonProps {
  allowedOrigins: string[];
  buildPayload?: () => Record<string, unknown>;
  clientId: string;
  intent: "login" | "register";
  onSuccess: (payload: Record<string, unknown>) => void;
}

let googleScriptPromise: Promise<void> | null = null;

export function GoogleAuthButton({
  allowedOrigins,
  buildPayload,
  clientId,
  intent,
  onSuccess
}: GoogleAuthButtonProps) {
  const buttonHostRef = useRef<HTMLDivElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [originAllowed, setOriginAllowed] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (allowedOrigins.length === 0) {
      setOriginAllowed(true);
      return;
    }

    setOriginAllowed(allowedOrigins.includes(window.location.origin));
  }, [allowedOrigins]);

  useEffect(() => {
    if (!clientId || !originAllowed || !buttonHostRef.current) {
      return;
    }

    void loadGoogleScript()
      .then(() => {
        if (!buttonHostRef.current || !window.google?.accounts.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "popup",
          callback: ({ credential }) => {
            const csrfToken = ensureClientToken(GOOGLE_CSRF_COOKIE);

            startTransition(async () => {
              try {
                const payload = await postJson<Record<string, unknown>>("/api/auth/google", {
                  credential,
                  csrfToken,
                  intent,
                  ...(buildPayload?.() ?? {})
                });
                setErrorMessage(null);
                onSuccess(payload);
              } catch (error) {
                setErrorMessage(
                  error instanceof Error ? error.message : "Google OAuth nao foi concluido."
                );
              }
            });
          }
        });

        buttonHostRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonHostRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: intent === "register" ? "signup_with" : "signin_with",
          width: buttonHostRef.current.clientWidth || 320
        });
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Google OAuth nao foi carregado."
        );
      });
  }, [allowedOrigins, buildPayload, clientId, intent, onSuccess, originAllowed]);

  if (!clientId) {
    return (
      <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Google OAuth indisponivel neste ambiente.
      </div>
    );
  }

  if (!originAllowed) {
    return (
      <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        A origem atual nao esta autorizada para o Google OAuth.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={buttonHostRef} className="flex min-h-12 items-center justify-center" />
      {isPending ? (
        <Button type="button" variant="secondary" className="w-full" disabled>
          Validando credencial Google...
        </Button>
      ) : null}
      <AuthFeedback message={errorMessage} tone="danger" />
    </div>
  );
}

function loadGoogleScript() {
  if (window.google?.accounts.id) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-google-identity="true"]'
      );

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Nao foi possivel carregar o script do Google.")),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Nao foi possivel carregar o script do Google."));
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
}
