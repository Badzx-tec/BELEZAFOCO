import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Field, Input } from "../components/ui";
import { useAuth } from "../lib/auth";

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
      setTimeout(() => navigate("/auth", { replace: true }), 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel redefinir a senha");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)] px-4 py-6">
      <Card className="w-full max-w-xl px-6 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Redefinir senha</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Crie sua nova senha</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">Use uma senha forte e confirme para atualizar o acesso da sua conta.</p>

        {message ? <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-800">{message}</div> : null}
        {error ? <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">{error}</div> : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Field label="Nova senha">
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimo 8 caracteres" />
          </Field>
          <Field label="Confirmar senha">
            <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repita a senha" />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" busy={busy}>
              Atualizar senha
            </Button>
            <Link to="/auth" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
              Voltar para login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
