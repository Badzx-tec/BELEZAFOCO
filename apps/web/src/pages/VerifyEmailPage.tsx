import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card } from "../components/ui";
import { useAuth } from "../lib/auth";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Validando seu link...");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Link de confirmacao invalido.");
      return;
    }
    const currentToken = token;

    let cancelled = false;

    async function confirm() {
      try {
        await verifyEmail(currentToken);
        if (!cancelled) {
          setStatus("success");
          setMessage("E-mail confirmado. Redirecionando para o painel...");
          setTimeout(() => navigate("/app", { replace: true }), 1200);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Nao foi possivel confirmar o e-mail");
        }
      }
    }

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [params, navigate, verifyEmail]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)] px-4 py-6">
      <Card className="w-full max-w-xl px-6 py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Confirmacao de e-mail</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">
          {status === "success" ? "Tudo certo." : status === "error" ? "Nao foi possivel confirmar." : "Validando acesso"}
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-500">{message}</p>
        {status === "loading" ? <div className="mx-auto mt-6 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" /> : null}
        {status === "error" ? (
          <div className="mt-8">
            <Link to="/auth">
              <Button>Voltar para login</Button>
            </Link>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
