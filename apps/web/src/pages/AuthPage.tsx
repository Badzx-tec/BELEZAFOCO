import { useEffect, useMemo, useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Badge, Button, Card, Field, Input } from "../components/ui";
import { ArrowRightIcon, BrandMark, CheckIcon, ShieldIcon, SparkIcon, WalletIcon } from "../components/premium";
import { PasswordField } from "../components/PasswordField";
import { getAuthConfig, useAuth } from "../lib/auth";
import { buildPublicBookingUrl, normalizeWorkspaceSlug } from "../lib/auth-ui";
import { readableError } from "../lib/format";

type AuthConfig = Awaited<ReturnType<typeof getAuthConfig>>;
type AuthMode = "login" | "register" | "forgot";

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  workspaceName: string;
  slug: string;
  whatsapp: string;
};

const registerInitialState: RegisterFormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  workspaceName: "",
  slug: "",
  whatsapp: ""
};

function pageOrigin(config: AuthConfig | null) {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return config?.googleCurrentOrigin ?? null;
}

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, register, loginWithGoogle, requestPasswordReset, resendVerification } = useAuth();
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(registerInitialState);
  const [registerSlugManual, setRegisterSlugManual] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [googleProfile, setGoogleProfile] = useState<{ email: string; name: string; avatarUrl?: string | null } | null>(null);
  const [googleWorkspace, setGoogleWorkspace] = useState({
    workspaceName: "",
    slug: "",
    whatsapp: ""
  });
  const [googleSlugManual, setGoogleSlugManual] = useState(false);

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
        if (!cancelled) {
          setConfig(next);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(readableError(loadError));
        }
      }
    }

    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  const bookingLinkPreview = useMemo(
    () => buildPublicBookingUrl(pageOrigin(config), registerForm.slug || registerForm.workspaceName),
    [config, registerForm.slug, registerForm.workspaceName]
  );

  const googleBookingPreview = useMemo(
    () => buildPublicBookingUrl(pageOrigin(config), googleWorkspace.slug || googleWorkspace.workspaceName),
    [config, googleWorkspace.slug, googleWorkspace.workspaceName]
  );

  const googleBadge = useMemo(() => {
    if (!config?.googleConfigured) {
      return { label: "Em configuracao", tone: "neutral" as const };
    }

    if (config.googleEnabled) {
      return { label: "Google ativo", tone: "success" as const };
    }

    return { label: "Indisponivel neste dominio", tone: "warning" as const };
  }, [config]);

  function clearFeedback() {
    setMessage(null);
    setError(null);
  }

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode);
    clearFeedback();
  }

  function handleWorkspaceNameChange(value: string) {
    setRegisterForm((current) => ({
      ...current,
      workspaceName: value,
      slug: registerSlugManual ? current.slug : normalizeWorkspaceSlug(value)
    }));
  }

  function handleGoogleWorkspaceNameChange(value: string) {
    setGoogleWorkspace((current) => ({
      ...current,
      workspaceName: value,
      slug: googleSlugManual ? current.slug : normalizeWorkspaceSlug(value)
    }));
  }

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setBlockedEmail(null);
    setBusy(true);

    try {
      const result = await login(loginForm);
      if ("blocked" in result && result.blocked) {
        setBlockedEmail(loginForm.email);
        setMessage(result.message);
        return;
      }

      navigate("/app", { replace: true });
    } catch (submitError) {
      setError(readableError(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setBusy(true);

    try {
      if (registerForm.password !== registerForm.confirmPassword) {
        throw new Error("Repita a mesma senha nos dois campos.");
      }

      const safeSlug = normalizeWorkspaceSlug(registerForm.slug || registerForm.workspaceName);
      if (safeSlug.length < 3) {
        throw new Error("Defina um link publico com pelo menos 3 caracteres.");
      }

      const result = await register({
        email: registerForm.email,
        password: registerForm.password,
        name: registerForm.name,
        workspaceName: registerForm.workspaceName,
        slug: safeSlug,
        whatsapp: registerForm.whatsapp || undefined
      });

      setLoginForm({ email: result.email, password: "" });
      setRegisterForm(registerInitialState);
      setRegisterSlugManual(false);
      setBlockedEmail(result.email);
      setMode("login");
      setMessage(
        result.emailSent
          ? `Conta criada. Enviamos a confirmacao para ${result.email}.`
          : `Conta criada, mas o e-mail ainda nao saiu. Reenvie a confirmacao para ${result.email}.`
      );
    } catch (submitError) {
      setError(readableError(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setBusy(true);

    try {
      await requestPasswordReset(forgotEmail);
      setMessage("Se existir uma conta com este e-mail, enviamos um link de redefinicao.");
    } catch (submitError) {
      setError(readableError(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function handleResendVerification() {
    if (!blockedEmail) return;

    clearFeedback();
    setBusy(true);

    try {
      await resendVerification(blockedEmail);
      setMessage(`Reenviamos o link de confirmacao para ${blockedEmail}.`);
    } catch (submitError) {
      setError(readableError(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSuccess(credential: string) {
    clearFeedback();
    setBusy(true);

    try {
      const result = await loginWithGoogle({ credential });
      if (result.mode === "needs_registration") {
        setGoogleCredential(credential);
        setGoogleProfile(result.profile);
        setGoogleWorkspace({
          workspaceName: result.profile.name,
          slug: normalizeWorkspaceSlug(result.profile.name),
          whatsapp: ""
        });
        setGoogleSlugManual(false);
        setMessage("Complete o nome do negocio para finalizar sua conta com Google.");
        return;
      }

      navigate("/app", { replace: true });
    } catch (googleError) {
      setError(readableError(googleError));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!googleCredential) return;

    clearFeedback();
    setBusy(true);

    try {
      const safeSlug = normalizeWorkspaceSlug(googleWorkspace.slug || googleWorkspace.workspaceName);
      if (safeSlug.length < 3) {
        throw new Error("Defina um link publico com pelo menos 3 caracteres.");
      }

      const result = await loginWithGoogle({
        credential: googleCredential,
        workspaceName: googleWorkspace.workspaceName,
        slug: safeSlug,
        whatsapp: googleWorkspace.whatsapp || undefined
      });

      if (result.mode === "authenticated") {
        navigate("/app", { replace: true });
      }
    } catch (googleError) {
      setError(readableError(googleError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(194,107,54,0.12),transparent_36%),linear-gradient(180deg,#f9f3ec_0%,#f5ecdf_46%,#efe3d4_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-6 lg:flex-row">
        <section className="surface-dark relative overflow-hidden px-6 py-8 sm:px-8 lg:w-1/2 lg:px-14 lg:py-14">
          <div className="absolute -right-16 top-0 h-64 w-64 rounded-full bg-[rgba(194,107,54,0.22)] blur-3xl" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <BrandMark inverse subtitle="Agenda premium para negocios de beleza" />
                <Link to="/" className="text-xs font-bold uppercase tracking-[0.24em] text-white/58 transition hover:text-white">
                  Voltar ao site
                </Link>
              </div>

              <div className="mt-10 max-w-xl">
                <Badge tone="accent" className="bg-amber-400/14 text-amber-100 ring-amber-300/20">
                  cadastro editorial
                </Badge>
                <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
                  Comece seu link publico premium com uma jornada limpa, curta e confiavel.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
                  Crie sua conta, confirme o e-mail e publique uma experiencia que transmite valor desde o primeiro clique.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/6 px-5 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <SparkIcon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/72">Setup rapido</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">Nome do negocio, link publico e acesso liberado sem atrito visual.</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/6 px-5 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
                  <ShieldIcon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/72">Confirmacao segura</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">Seu acesso so entra na plataforma depois da validacao do e-mail.</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/6 px-5 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <WalletIcon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/72">Pronto para vender</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">Link publico, Pix, agenda e onboarding no mesmo produto desde o dia 1.</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/6 px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/48">Credibilidade</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex -space-x-3">
                    <img alt="Cliente premium 1" className="h-11 w-11 rounded-full border-2 border-slate-950 object-cover" src="/professionals-placeholders/artist-amber.svg" />
                    <img alt="Cliente premium 2" className="h-11 w-11 rounded-full border-2 border-slate-950 object-cover" src="/professionals-placeholders/artist-graphite.svg" />
                  </div>
                  <p className="text-sm leading-6 text-slate-300">Estudios, barbearias e nail designers ativando o fluxo com visual premium.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="surface flex items-center px-4 py-4 sm:px-6 lg:w-1/2">
          <Card className="w-full px-6 py-6 sm:px-7 sm:py-7">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={mode === "login" ? "primary" : "secondary"} size="sm" onClick={() => handleModeChange("login")}>
                Login
              </Button>
              <Button type="button" variant={mode === "register" ? "primary" : "secondary"} size="sm" onClick={() => handleModeChange("register")}>
                Registrar
              </Button>
              <Button type="button" variant={mode === "forgot" ? "primary" : "secondary"} size="sm" onClick={() => handleModeChange("forgot")}>
                Recuperar senha
              </Button>
            </div>

            <div className="mt-8">
              <h2 className="text-3xl font-semibold text-slate-950">
                {mode === "register" ? "Crie sua conta" : mode === "forgot" ? "Recupere o acesso" : "Entre no painel"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {mode === "register"
                  ? "Preencha o essencial para publicar seu negocio com um link proprio."
                  : mode === "forgot"
                    ? "Informe seu e-mail e enviaremos um link seguro para redefinir sua senha."
                    : "Use seu e-mail e senha para continuar a configuracao ou operar o workspace."}
              </p>
            </div>

            {message ? <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-800">{message}</div> : null}
            {error ? <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">{error}</div> : null}

            {mode === "login" ? (
              <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
                <Field label="E-mail">
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="voce@seunegocio.com"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </Field>
                <PasswordField
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  label="Senha"
                  placeholder="Sua senha"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" busy={busy} className="gap-2">
                    Entrar
                    {!busy ? <ArrowRightIcon className="h-4 w-4" /> : null}
                  </Button>
                  <button type="button" className="text-sm font-semibold text-slate-500 hover:text-slate-900" onClick={() => handleModeChange("forgot")}>
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
                <Field label="Nome completo">
                  <Input
                    id="register-name"
                    name="name"
                    autoComplete="name"
                    placeholder="Ex: Ricardo Silva"
                    value={registerForm.name}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </Field>
                <Field label="WhatsApp" hint="Opcional">
                  <Input
                    id="register-whatsapp"
                    name="whatsapp"
                    autoComplete="tel"
                    placeholder="+55 11 99999-9999"
                    value={registerForm.whatsapp}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, whatsapp: event.target.value }))}
                  />
                </Field>
                <Field label="E-mail profissional" className="sm:col-span-2">
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="contato@seunegocio.com"
                    value={registerForm.email}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </Field>
                <Field label="Nome do negocio" className="sm:col-span-2">
                  <Input
                    id="register-workspace-name"
                    name="workspaceName"
                    autoComplete="organization"
                    placeholder="Ex: Studio Beleza Foco"
                    value={registerForm.workspaceName}
                    onChange={(event) => handleWorkspaceNameChange(event.target.value)}
                  />
                </Field>
                <Field label="Link publico" hint="gerado automaticamente" className="sm:col-span-2">
                  <Input
                    id="register-slug"
                    name="slug"
                    autoComplete="off"
                    placeholder="studio-beleza-foco"
                    value={registerForm.slug}
                    onChange={(event) => {
                      setRegisterSlugManual(true);
                      setRegisterForm((current) => ({ ...current, slug: normalizeWorkspaceSlug(event.target.value) }));
                    }}
                  />
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{bookingLinkPreview}</p>
                </Field>
                <PasswordField
                  id="register-password"
                  name="password"
                  autoComplete="new-password"
                  label="Senha"
                  placeholder="Minimo 8 caracteres"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                />
                <PasswordField
                  id="register-confirm-password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  label="Repita a senha"
                  placeholder="Digite a mesma senha"
                  value={registerForm.confirmPassword}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                />
                <div className="sm:col-span-2">
                  <Button type="submit" busy={busy} className="gap-2">
                    Criar conta
                    {!busy ? <ArrowRightIcon className="h-4 w-4" /> : null}
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
                    autoComplete="email"
                    placeholder="voce@seunegocio.com"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                  />
                </Field>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" busy={busy}>
                    Enviar link
                  </Button>
                  <button type="button" className="text-sm font-semibold text-slate-500 hover:text-slate-900" onClick={() => handleModeChange("login")}>
                    Voltar ao login
                  </button>
                </div>
              </form>
            ) : null}

            {mode !== "forgot" ? (
              <>
                <div className="mt-8 flex items-center gap-3">
                  <div className="hairline h-px flex-1" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">ou continue com</span>
                  <div className="hairline h-px flex-1" />
                </div>

                <div className="mt-6 rounded-[28px] border border-slate-200/80 bg-slate-50/70 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Google</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">Entre ou finalize seu cadastro com a mesma conta Google do negocio.</p>
                    </div>
                    <Badge tone={googleBadge.tone}>{googleBadge.label}</Badge>
                  </div>

                  <div className="mt-4">
                    {config?.googleEnabled && config.googleClientId ? (
                      <GoogleOAuthProvider clientId={config.googleClientId}>
                        <div className="space-y-4">
                          <GoogleLogin
                            locale="pt_BR"
                            text="continue_with"
                            theme="filled_black"
                            shape="pill"
                            onSuccess={(response) => {
                              if (response.credential) {
                                void handleGoogleSuccess(response.credential);
                              }
                            }}
                            onError={() => setError("Nao foi possivel iniciar o acesso com Google.")}
                          />

                          {googleProfile && googleCredential ? (
                            <form className="grid gap-4 rounded-[24px] border border-slate-200 bg-white px-4 py-4" onSubmit={handleGoogleRegisterSubmit}>
                              <div className="flex items-center gap-3">
                                {googleProfile.avatarUrl ? (
                                  <img alt={googleProfile.name} className="h-12 w-12 rounded-full object-cover" src={googleProfile.avatarUrl} />
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                                    {googleProfile.name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">{googleProfile.name}</p>
                                  <p className="mt-1 text-sm text-slate-500">{googleProfile.email}</p>
                                </div>
                              </div>
                              <Field label="Nome do negocio">
                                <Input autoComplete="organization" value={googleWorkspace.workspaceName} onChange={(event) => handleGoogleWorkspaceNameChange(event.target.value)} />
                              </Field>
                              <Field label="Link publico">
                                <Input
                                  autoComplete="off"
                                  value={googleWorkspace.slug}
                                  onChange={(event) => {
                                    setGoogleSlugManual(true);
                                    setGoogleWorkspace((current) => ({ ...current, slug: normalizeWorkspaceSlug(event.target.value) }));
                                  }}
                                />
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{googleBookingPreview}</p>
                              </Field>
                              <Field label="WhatsApp" hint="Opcional">
                                <Input autoComplete="tel" value={googleWorkspace.whatsapp} onChange={(event) => setGoogleWorkspace((current) => ({ ...current, whatsapp: event.target.value }))} />
                              </Field>
                              <Button type="submit" busy={busy}>
                                Finalizar cadastro com Google
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </GoogleOAuthProvider>
                    ) : (
                      <p className="text-sm leading-7 text-slate-500">
                        Google ainda nao esta liberado neste dominio. O acesso por e-mail continua disponivel enquanto a liberacao termina.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : null}

            <div className="mt-8 rounded-[24px] border border-slate-200/80 bg-white/70 px-4 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <CheckIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Tudo em uma pagina limpa</p>
                  <p className="mt-1 text-sm leading-7 text-slate-500">
                    Login, registro e recuperacao sem texto tecnico, sem distrações e com o link publico do negocio ja pronto para conferência.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
