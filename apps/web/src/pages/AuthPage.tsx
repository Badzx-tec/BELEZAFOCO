import { useEffect, useMemo, useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Badge, Button, Card, Field, Input } from "../components/ui";
import { getAuthConfig, useAuth } from "../lib/auth";

type AuthConfig = Awaited<ReturnType<typeof getAuthConfig>>;

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, register, loginWithGoogle, requestPasswordReset, resendVerification } = useAuth();
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    workspaceName: "",
    slug: "",
    whatsapp: ""
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [googleProfile, setGoogleProfile] = useState<{ email: string; name: string; avatarUrl?: string | null } | null>(null);
  const [googleWorkspace, setGoogleWorkspace] = useState({
    workspaceName: "",
    slug: "",
    whatsapp: ""
  });

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = (location.state as { from?: string } | null)?.from ?? "/app";
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const next = await getAuthConfig();
        if (!cancelled) setConfig(next);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar a autenticacao");
      }
    }

    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  const heroText = useMemo(
    () =>
      mode === "register"
        ? "Crie seu workspace com e-mail verificado e onboarding real."
        : mode === "forgot"
          ? "Recupere o acesso com fluxo seguro de redefinicao."
          : "Entre com sua conta e continue a operacao real do seu negocio.",
    [mode]
  );

  const googleStatus = useMemo(() => {
    if (!config?.googleConfigured) {
      return { label: "Pendente", tone: "neutral" as const };
    }

    if (config.googleEnabled) {
      return { label: "Ativo", tone: "success" as const };
    }

    return { label: "Bloqueado", tone: "warning" as const };
  }, [config]);

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    setBlockedEmail(null);

    try {
      const result = await login(loginForm);
      if ("blocked" in result && result.blocked) {
        setBlockedEmail(loginForm.email);
        setMessage(result.message);
        return;
      }

      navigate("/app", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel entrar");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const result = await register(registerForm);
      setMode("login");
      setMessage(
        result.emailSent
          ? `Conta criada. Enviamos a confirmacao para ${result.email}.`
          : `Conta criada, mas o e-mail nao saiu agora. Use "reenviar confirmacao" para ${result.email}.`
      );
      setBlockedEmail(result.email);
      setLoginForm((current) => ({ ...current, email: result.email }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel criar a conta");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await requestPasswordReset(forgotEmail);
      setMessage("Se existir uma conta com este e-mail, enviamos o link de redefinicao.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel iniciar a recuperacao");
    } finally {
      setBusy(false);
    }
  }

  async function handleResendVerification() {
    if (!blockedEmail) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await resendVerification(blockedEmail);
      setMessage(`Reenviamos o link de confirmacao para ${blockedEmail}.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel reenviar o e-mail");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleCredential(credential: string) {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const result = await loginWithGoogle({ credential });
      if (result.mode === "needs_registration") {
        setGoogleCredential(credential);
        setGoogleProfile(result.profile);
        setGoogleWorkspace({
          workspaceName: result.profile.name,
          slug: normalizeSlug(result.profile.name),
          whatsapp: ""
        });
        setMessage("Complete o nome do negocio para finalizar sua conta com Google.");
        return;
      }

      navigate("/app", { replace: true });
    } catch (googleError) {
      setError(googleError instanceof Error ? googleError.message : "Nao foi possivel entrar com Google");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!googleCredential) return;

    setBusy(true);
    setError(null);

    try {
      const result = await loginWithGoogle({
        credential: googleCredential,
        workspaceName: googleWorkspace.workspaceName,
        slug: googleWorkspace.slug,
        whatsapp: googleWorkspace.whatsapp
      });

      if (result.mode === "authenticated") {
        navigate("/app", { replace: true });
      }
    } catch (googleError) {
      setError(googleError instanceof Error ? googleError.message : "Nao foi possivel finalizar o cadastro com Google");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(194,107,54,0.14),transparent_36%),linear-gradient(180deg,#fffaf6_0%,#f8f6f1_48%,#f5f5f4_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="surface-dark relative overflow-hidden px-7 py-8 sm:px-8 sm:py-10">
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(194,107,54,0.3),transparent_58%)]" />
          <div className="relative">
            <Badge tone="accent" className="bg-amber-400/12 text-amber-100 ring-amber-300/20">
              Producao real
            </Badge>
            <h1 className="mt-6 max-w-lg text-balance font-[Sora] text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Login, registro e onboarding em fluxo real.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">{heroText}</p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                "Verificacao de e-mail obrigatoria",
                "Google Sign-In com token verificado no backend",
                "JWT com refresh token rotativo",
                "Workspace e RBAC desde o primeiro acesso"
              ].map((item) => (
                <div key={item} className="rounded-[28px] border border-white/10 bg-white/8 px-4 py-4 text-sm leading-7 text-slate-200">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-[32px] border border-white/10 bg-white/6 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Fluxo ativo</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-[24px] bg-white/8 px-4 py-4">
                  <p className="text-sm font-semibold text-white">1. Cadastro ou Google</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Conta vinculada ao workspace e aos limites do plano.</p>
                </div>
                <div className="rounded-[24px] bg-white/8 px-4 py-4">
                  <p className="text-sm font-semibold text-white">2. Verificacao por e-mail</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Sem ativar o e-mail, a sessao nao entra no painel.</p>
                </div>
                <div className="rounded-[24px] bg-white/8 px-4 py-4">
                  <p className="text-sm font-semibold text-white">3. Painel por workspace</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Resumo real carregado via `/auth/me` e `/me/dashboard/summary`.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="surface flex items-center px-4 py-4 sm:px-6">
          <Card className="w-full px-6 py-6 sm:px-7 sm:py-7">
            <div className="flex flex-wrap gap-2">
              <Button variant={mode === "login" ? "primary" : "secondary"} size="sm" onClick={() => setMode("login")}>
                Entrar
              </Button>
              <Button variant={mode === "register" ? "primary" : "secondary"} size="sm" onClick={() => setMode("register")}>
                Criar conta
              </Button>
              <Button variant={mode === "forgot" ? "primary" : "secondary"} size="sm" onClick={() => setMode("forgot")}>
                Recuperar senha
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {message ? <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-800">{message}</div> : null}
              {error ? <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">{error}</div> : null}
            </div>

            {mode === "login" ? (
              <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
                <Field label="E-mail">
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="voce@empresa.com"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Senha">
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                  />
                </Field>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" busy={busy}>
                    Entrar no painel
                  </Button>
                  <button type="button" className="text-sm font-semibold text-slate-500 hover:text-slate-900" onClick={() => setMode("forgot")}>
                    Esqueci minha senha
                  </button>
                </div>
                {blockedEmail ? (
                  <button type="button" className="text-sm font-semibold text-[var(--accent)]" onClick={() => void handleResendVerification()}>
                    Reenviar confirmacao para {blockedEmail}
                  </button>
                ) : null}
              </form>
            ) : null}

            {mode === "register" ? (
              <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleRegisterSubmit}>
                <Field label="Nome">
                  <Input id="register-name" name="name" value={registerForm.name} onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))} />
                </Field>
                <Field label="WhatsApp">
                  <Input
                    id="register-whatsapp"
                    name="whatsapp"
                    value={registerForm.whatsapp}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, whatsapp: event.target.value }))}
                    placeholder="+55 11 99999-9999"
                  />
                </Field>
                <Field label="E-mail" className="sm:col-span-2">
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    value={registerForm.email}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="contato@seunegocio.com"
                  />
                </Field>
                <Field label="Senha">
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    value={registerForm.password}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Minimo 8 caracteres"
                  />
                </Field>
                <Field label="Nome do negocio">
                  <Input
                    id="register-workspace-name"
                    name="workspaceName"
                    value={registerForm.workspaceName}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        workspaceName: event.target.value,
                        slug: current.slug || normalizeSlug(event.target.value)
                      }))
                    }
                    placeholder="Studio Beleza Foco"
                  />
                </Field>
                <Field label="Link publico" hint="slug unico" className="sm:col-span-2">
                  <Input
                    id="register-slug"
                    name="slug"
                    value={registerForm.slug}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, slug: normalizeSlug(event.target.value) }))}
                    placeholder="studio-beleza-foco"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Button type="submit" busy={busy}>
                    Criar conta e enviar confirmacao
                  </Button>
                </div>
              </form>
            ) : null}

            {mode === "forgot" ? (
              <form className="mt-6 space-y-4" onSubmit={handleForgotSubmit}>
                <Field label="E-mail da conta">
                  <Input
                    id="forgot-email"
                    name="email"
                    type="email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    placeholder="voce@empresa.com"
                  />
                </Field>
                <Button type="submit" busy={busy}>
                  Enviar link de redefinicao
                </Button>
              </form>
            ) : null}

            <div className="mt-8 hairline h-px" />

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Continuar com Google</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Token verificado no backend e provisionamento de workspace no primeiro acesso.</p>
                </div>
                <Badge tone={googleStatus.tone}>{googleStatus.label}</Badge>
              </div>

              {config?.googleEnabled && config.googleClientId ? (
                <GoogleOAuthProvider clientId={config.googleClientId}>
                  <div className="flex flex-col gap-4">
                    <GoogleLogin
                      onSuccess={(response) => {
                        if (response.credential) {
                          void handleGoogleCredential(response.credential);
                        }
                      }}
                      onError={() => setError("Nao foi possivel iniciar o login Google")}
                      locale="pt_BR"
                      text="signin_with"
                      theme="filled_black"
                      shape="pill"
                    />
                    {googleProfile && googleCredential ? (
                      <form className="grid gap-4 rounded-[28px] border border-slate-200/80 bg-slate-50/80 px-4 py-4" onSubmit={handleGoogleRegisterSubmit}>
                        <div className="flex items-center gap-3">
                          {googleProfile.avatarUrl ? <img src={googleProfile.avatarUrl} alt={googleProfile.name} className="h-12 w-12 rounded-full object-cover" /> : null}
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{googleProfile.name}</p>
                            <p className="text-sm text-slate-500">{googleProfile.email}</p>
                          </div>
                        </div>
                        <Field label="Nome do negocio">
                          <Input
                            id="google-workspace-name"
                            name="workspaceName"
                            value={googleWorkspace.workspaceName}
                            onChange={(event) =>
                              setGoogleWorkspace((current) => ({
                                ...current,
                                workspaceName: event.target.value,
                                slug: current.slug || normalizeSlug(event.target.value)
                              }))
                            }
                          />
                        </Field>
                        <Field label="Slug publico">
                          <Input
                            id="google-slug"
                            name="slug"
                            value={googleWorkspace.slug}
                            onChange={(event) => setGoogleWorkspace((current) => ({ ...current, slug: normalizeSlug(event.target.value) }))}
                          />
                        </Field>
                        <Field label="WhatsApp">
                          <Input id="google-whatsapp" name="whatsapp" value={googleWorkspace.whatsapp} onChange={(event) => setGoogleWorkspace((current) => ({ ...current, whatsapp: event.target.value }))} />
                        </Field>
                        <Button type="submit" busy={busy}>
                          Finalizar conta com Google
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </GoogleOAuthProvider>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-500">
                  <p>{config?.googleDisabledReason ?? "Configure GOOGLE_CLIENT_ID no backend para liberar o botao real do Google Sign-In."}</p>
                  {config?.googleCurrentOrigin ? (
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Dominio detectado: {config.googleCurrentOrigin}</p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-8 text-sm text-slate-500">
              Ao continuar, voce concorda com os termos do BELEZAFOCO. Precisa voltar ao site?{" "}
              <Link to="/" className="font-semibold text-slate-900">
                Abrir landing
              </Link>
              .
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
