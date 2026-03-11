type PublicAuthConfigInput = {
  googleClientId?: string | null;
  publicUrl?: string | null;
  apiBaseUrl?: string | null;
  appUrl?: string | null;
  googleAllowedOrigins?: string | null;
};

export type PublicAuthConfig = {
  googleConfigured: boolean;
  googleEnabled: boolean;
  googleClientId: string | null;
  googleDisabledReason: string | null;
  googleCurrentOrigin: string | null;
  emailPasswordEnabled: boolean;
  emailVerificationRequired: boolean;
};

function normalizeOrigin(value?: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function parseOriginsList(value?: string | null) {
  return (value ?? "")
    .split(",")
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter((origin): origin is string => Boolean(origin));
}

function resolveAllowedGoogleOrigins(input: PublicAuthConfigInput) {
  const explicitOrigins = parseOriginsList(input.googleAllowedOrigins);
  if (explicitOrigins.length > 0) {
    return [...new Set(explicitOrigins)];
  }

  return [...new Set([normalizeOrigin(input.publicUrl), normalizeOrigin(input.apiBaseUrl), normalizeOrigin(input.appUrl)].filter((origin): origin is string => Boolean(origin)))];
}

export function buildPublicAuthConfig(input: PublicAuthConfigInput, requestOrigin?: string | null): PublicAuthConfig {
  const googleConfigured = Boolean(input.googleClientId);
  const googleCurrentOrigin = normalizeOrigin(requestOrigin);
  const allowedOrigins = resolveAllowedGoogleOrigins(input);
  const originAllowed = !googleCurrentOrigin || allowedOrigins.length === 0 || allowedOrigins.includes(googleCurrentOrigin);
  const googleEnabled = googleConfigured && originAllowed;

  const googleDisabledReason = !googleConfigured
    ? "Configure GOOGLE_CLIENT_ID para liberar o fluxo real de Google Sign-In."
    : googleEnabled
      ? null
      : `Google Sign-In temporariamente indisponivel neste dominio publicado. Autorize ${googleCurrentOrigin ?? "a origem atual"} em Authorized JavaScript origins no Google Cloud Console ou alinhe GOOGLE_ALLOWED_ORIGINS/PUBLIC_URL.`;

  return {
    googleConfigured,
    googleEnabled,
    googleClientId: googleEnabled ? input.googleClientId ?? null : null,
    googleDisabledReason,
    googleCurrentOrigin,
    emailPasswordEnabled: true,
    emailVerificationRequired: true
  };
}
