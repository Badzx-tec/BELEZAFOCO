import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { api } from "./api";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const storageKey = "belezafoco.auth";

type WorkspaceSummary = {
  id: string;
  role: string;
  name: string;
  slug: string;
  timezone: string;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  emailVerifiedAt?: string | null;
  workspaces: WorkspaceSummary[];
};

type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  user: Omit<CurrentUser, "workspaces">;
  workspaces: WorkspaceSummary[];
};

type GoogleAuthResult =
  | ({ mode: "authenticated" } & SessionPayload)
  | {
      mode: "needs_registration";
      profile: {
        email: string;
        name: string;
        avatarUrl?: string | null;
      };
    };

type AuthContextValue = {
  ready: boolean;
  isAuthenticated: boolean;
  user: CurrentUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeWorkspace: WorkspaceSummary | null;
  setActiveWorkspaceId: (workspaceId: string) => void;
  login: (input: { email: string; password: string }) => Promise<SessionPayload | { blocked: true; code: string; message: string }>;
  register: (input: {
    email: string;
    password: string;
    name: string;
    workspaceName: string;
    slug: string;
    whatsapp?: string;
    timezone?: string;
  }) => Promise<{ requiresEmailVerification: boolean; email: string; emailSent: boolean }>;
  loginWithGoogle: (input: {
    credential: string;
    workspaceName?: string;
    slug?: string;
    whatsapp?: string;
    timezone?: string;
  }) => Promise<GoogleAuthResult>;
  verifyEmail: (token: string) => Promise<SessionPayload>;
  resendVerification: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authorizedApi: <T>(path: string, init?: RequestInit) => Promise<T>;
};

type PersistedState = {
  accessToken: string | null;
  refreshToken: string | null;
  activeWorkspaceId: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readPersistedState(): PersistedState {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, activeWorkspaceId: null };
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return { accessToken: null, refreshToken: null, activeWorkspaceId: null };
  }

  try {
    return JSON.parse(raw) as PersistedState;
  } catch {
    return { accessToken: null, refreshToken: null, activeWorkspaceId: null };
  }
}

function writePersistedState(state: PersistedState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(typeof payload === "string" ? payload : payload?.message ?? "Erro inesperado");
    (error as Error & { statusCode?: number; data?: unknown }).statusCode = response.status;
    (error as Error & { statusCode?: number; data?: unknown }).data = payload;
    throw error;
  }

  return payload as T;
}

async function fetchJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {})
    }
  });

  return parseResponse<T>(response);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const persisted = readPersistedState();
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(persisted.accessToken);
  const [refreshToken, setRefreshToken] = useState<string | null>(persisted.refreshToken);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(persisted.activeWorkspaceId);

  const persist = (next: PersistedState) => {
    writePersistedState(next);
    setAccessToken(next.accessToken);
    setRefreshToken(next.refreshToken);
    setActiveWorkspaceIdState(next.activeWorkspaceId);
  };

  const hydrateSession = (payload: SessionPayload) => {
    const workspaces = payload.workspaces;
    const nextWorkspaceId = activeWorkspaceId && workspaces.some((workspace) => workspace.id === activeWorkspaceId) ? activeWorkspaceId : workspaces[0]?.id ?? null;

    setUser({
      ...payload.user,
      workspaces
    });

    persist({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      activeWorkspaceId: nextWorkspaceId
    });
  };

  const clearSession = () => {
    setUser(null);
    persist({
      accessToken: null,
      refreshToken: null,
      activeWorkspaceId: null
    });
  };

  const fetchMe = async (token: string, refreshOverride = refreshToken) => {
    const me = await fetchJson<CurrentUser>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    setUser(me);

    if (!activeWorkspaceId && me.workspaces[0]?.id) {
      persist({
        accessToken: token,
        refreshToken: refreshOverride,
        activeWorkspaceId: me.workspaces[0].id
      });
    }

    return me;
  };

  const rotateRefreshToken = async (currentRefreshToken: string) => {
    const next = await fetchJson<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: currentRefreshToken })
    });

    persist({
      accessToken: next.accessToken,
      refreshToken: next.refreshToken,
      activeWorkspaceId
    });

    return next;
  };

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!accessToken) {
        setReady(true);
        return;
      }

      try {
        await fetchMe(accessToken);
      } catch (error) {
        if (!refreshToken) {
          clearSession();
          if (!cancelled) setReady(true);
          return;
        }

        try {
          const next = await rotateRefreshToken(refreshToken);
          await fetchMe(next.accessToken, next.refreshToken);
        } catch {
          clearSession();
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const setActiveWorkspaceId = (workspaceId: string) => {
    persist({
      accessToken,
      refreshToken,
      activeWorkspaceId: workspaceId
    });
  };

  const login = async (input: { email: string; password: string }) => {
    const payload = await fetchJson<SessionPayload | { blocked: true; code: string; message: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    });

    if ("blocked" in payload && payload.blocked) {
      return payload;
    }

    const session = payload as SessionPayload;
    hydrateSession(session);
    return session;
  };

  const register = async (input: {
    email: string;
    password: string;
    name: string;
    workspaceName: string;
    slug: string;
    whatsapp?: string;
    timezone?: string;
  }) => {
    return fetchJson<{ requiresEmailVerification: boolean; email: string; emailSent: boolean }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        timezone: input.timezone ?? "America/Sao_Paulo"
      })
    });
  };

  const loginWithGoogle = async (input: {
    credential: string;
    workspaceName?: string;
    slug?: string;
    whatsapp?: string;
    timezone?: string;
  }) => {
    const payload = await fetchJson<GoogleAuthResult>("/auth/google", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        timezone: input.timezone ?? "America/Sao_Paulo"
      })
    });

    if (payload.mode === "authenticated") {
      hydrateSession(payload);
    }

    return payload;
  };

  const verifyEmail = async (token: string) => {
    const payload = await fetchJson<SessionPayload>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token })
    });

    hydrateSession(payload);
    return payload;
  };

  const resendVerification = async (email: string) => {
    await fetchJson("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  };

  const requestPasswordReset = async (email: string) => {
    await fetchJson("/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  };

  const resetPassword = async (token: string, password: string) => {
    await fetchJson("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password })
    });
  };

  const logout = async () => {
    if (refreshToken) {
      try {
        await fetchJson("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken })
        });
      } catch {
        // Session cleanup is local-first.
      }
    }

    clearSession();
  };

  const authorizedApi = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    if (!accessToken) {
      throw new Error("Sessao expirada");
    }

    const execute = async (token: string) => {
      const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
          ...(init?.body ? { "content-type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(activeWorkspaceId ? { "x-workspace-id": activeWorkspaceId } : {}),
          ...(init?.headers ?? {})
        }
      });

      return parseResponse<T>(response);
    };

    try {
      return await execute(accessToken);
    } catch (error) {
      const statusCode = (error as Error & { statusCode?: number }).statusCode;
      if (statusCode !== 401 || !refreshToken) {
        throw error;
      }

      const next = await rotateRefreshToken(refreshToken);
      return execute(next.accessToken);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      isAuthenticated: Boolean(user && accessToken),
      user,
      accessToken,
      refreshToken,
      activeWorkspace: user?.workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? user?.workspaces[0] ?? null,
      setActiveWorkspaceId,
      login,
      register,
      loginWithGoogle,
      verifyEmail,
      resendVerification,
      requestPasswordReset,
      resetPassword,
      logout,
      authorizedApi
    }),
    [ready, user, accessToken, refreshToken, activeWorkspaceId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}

export async function getAuthConfig() {
  return api<{
    googleConfigured: boolean;
    googleEnabled: boolean;
    googleClientId: string | null;
    googleDisabledReason: string | null;
    googleCurrentOrigin: string | null;
    emailPasswordEnabled: boolean;
    emailVerificationRequired: boolean;
  }>("/auth/config");
}
