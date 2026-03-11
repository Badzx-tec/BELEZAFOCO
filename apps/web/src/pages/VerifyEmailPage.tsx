import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandMark, CheckIcon, ShieldIcon } from "../components/premium";
import { Badge, Button, Card } from "../components/ui";
import { useAuth } from "../lib/auth";
import { readableError } from "../lib/format";

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { verifyEmail } = useAuth();
  const [attempt, setAttempt] = useState(0);
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
          setMessage("E-mail confirmado. Abrindo a configuracao inicial do seu estudio...");
          window.setTimeout(() => window.location.assign("/app/setup"), 900);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(readableError(error));
        }
      }
    }

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [attempt, params, verifyEmail]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(194,107,54,0.12),transparent_36%),linear-gradient(180deg,#f9f3ec_0%,#f3e7d9_100%)] px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center">
        <Card className="grid w-full gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="surface-dark overflow-hidden px-6 py-8 text-white">
            <BrandMark inverse subtitle="Confirmacao de acesso" />
            <h1 className="mt-8 text-4xl font-semibold leading-tight">
              {status === "success" ? "Conta confirmada." : status === "error" ? "Nao foi possivel validar." : "Validando seu acesso."}
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">{message}</p>
            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 px-5 py-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
                  {status === "success" ? <CheckIcon className="h-4 w-4" /> : <ShieldIcon className="h-4 w-4" />}
                </span>
                <p className="text-sm leading-7 text-slate-200">
                  Depois da confirmacao, o sistema abre a configuracao do estudio para concluir o onboarding com dados reais do workspace.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <Badge tone={status === "success" ? "success" : status === "error" ? "danger" : "accent"}>
              {status === "success" ? "Tudo certo" : status === "error" ? "Precisa de atencao" : "Verificando"}
            </Badge>
            <h2 className="mt-5 text-3xl font-semibold text-slate-950">
              {status === "success" ? "Vamos para o painel." : status === "error" ? "Seu link nao passou na validacao." : "Aguarde um instante."}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">{message}</p>

            {status === "loading" ? <div className="mt-6 h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" /> : null}

            {status === "error" ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <Button type="button" onClick={() => setAttempt((current) => current + 1)}>
                  Tentar novamente
                </Button>
                <Link to="/auth">
                  <Button type="button" variant="secondary">
                    Voltar para login
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
