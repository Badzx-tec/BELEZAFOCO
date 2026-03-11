import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BrandMark, ShieldIcon } from "../components/premium";
import { Button, Card } from "../components/ui";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../lib/auth";
import { readableError } from "../lib/format";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = params.get("token");

    if (!token) {
      setError("Link de redefinicao invalido.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await resetPassword(token, password);
      setMessage("Senha atualizada com sucesso. Redirecionando para o login...");
      window.setTimeout(() => navigate("/auth", { replace: true }), 900);
    } catch (submitError) {
      setError(readableError(submitError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(194,107,54,0.12),transparent_34%),linear-gradient(180deg,#f9f3ec_0%,#f3e7d9_100%)] px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center">
        <Card className="grid w-full gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="surface-dark overflow-hidden px-6 py-8 text-white">
            <BrandMark inverse subtitle="Nova senha" />
            <h1 className="mt-8 text-4xl font-semibold leading-tight">Defina uma senha nova e volte para o painel com seguranca.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Use uma senha forte, confirme nos dois campos e finalize a troca sem depender de suporte manual.
            </p>
            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 px-5 py-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
                  <ShieldIcon className="h-4 w-4" />
                </span>
                <p className="text-sm leading-7 text-slate-200">
                  Assim que a senha for atualizada, todas as sessoes anteriores sao encerradas para manter o acesso protegido.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Redefinir senha</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">Crie sua nova senha</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">Repita a senha duas vezes para evitar erro de digitacao antes do login.</p>

            {message ? <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-800">{message}</div> : null}
            {error ? <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">{error}</div> : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <PasswordField
                id="reset-password"
                name="password"
                autoComplete="new-password"
                label="Nova senha"
                placeholder="Minimo 8 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <PasswordField
                id="reset-confirm-password"
                name="confirmPassword"
                autoComplete="new-password"
                label="Repita a senha"
                placeholder="Digite a mesma senha"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" busy={busy}>
                  Atualizar senha
                </Button>
                <Link to="/auth" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
                  Voltar para login
                </Link>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
