export const API_URL = import.meta.env.VITE_API_URL ?? inferApiUrl();
const SESSION_KEY = "belezafoco.session";
const authPaths = new Set(["/auth/login", "/auth/register", "/auth/refresh"]);

export type Session = {
  accessToken: string;
  refreshToken: string;
  activeWorkspaceId: string;
  user: { id: string; name: string; email: string };
  workspaces: Array<{ id: string; name: string; slug: string; role: string }>;
};

type ApiOptions = RequestInit & {
  session?: Session | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: ApiOptions) {
  try {
    return await requestWithRefresh<T>(path, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError("Nao foi possivel conectar com o servidor.", 0);
    }
    throw error;
  }
}

async function requestWithRefresh<T>(path: string, init?: ApiOptions, hasRetried = false): Promise<T> {
  try {
    return await requestJson<T>(path, init);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.statusCode !== 401 || !init?.session || hasRetried || authPaths.has(path)) {
      throw error;
    }

    try {
      const nextSession = await refreshSession(init.session);
      Object.assign(init.session, nextSession);
      return await requestJson<T>(path, {
        ...init,
        session: nextSession
      });
    } catch {
      clearSession();
      throw new ApiError("Sessao expirada. Entre novamente para continuar.", 401);
    }
  }
}

async function requestJson<T>(path: string, init?: ApiOptions) {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (init?.session?.accessToken) {
    headers.set("authorization", `Bearer ${init.session.accessToken}`);
  }
  if (init?.session?.activeWorkspaceId) {
    headers.set("x-workspace-id", init.session.activeWorkspaceId);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    body: init?.body
  });

  if (!response.ok) {
    const details = await parseBody(response);
    const message =
      typeof details === "object" && details && "message" in details && typeof (details as { message?: unknown }).message === "string"
        ? (details as { message: string }).message
        : typeof details === "string" && details.length > 0
          ? details
          : "Nao foi possivel concluir a operacao.";
    throw new ApiError(message, response.status, details);
  }

  return parseBody(response) as Promise<T>;
}

export function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function refreshSession(session: Session) {
  const refreshed = await requestJson<Pick<Session, "accessToken" | "refreshToken">>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({
      refreshToken: session.refreshToken,
      workspaceId: session.activeWorkspaceId
    })
  });

  const nextSession = {
    ...session,
    ...refreshed
  };
  saveSession(nextSession);
  return nextSession;
}

async function parseBody(response: Response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function inferApiUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:3333";
  }

  const currentUrl = new URL(window.location.href);
  if (currentUrl.port === "5173" || currentUrl.port === "4173") {
    return `${currentUrl.protocol}//${currentUrl.hostname}:3333`;
  }

  return "http://localhost:3333";
}
