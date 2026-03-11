export const API_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly payload?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type WorkspaceSessionSummary = {
  id: string;
  role: string;
  name: string;
  slug: string;
  timezone: string;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  activeWorkspaceId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    emailVerifiedAt?: string | null;
  };
  workspaces: WorkspaceSessionSummary[];
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {})
    }
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload?.message ?? "Erro inesperado";
    throw new ApiError(message, response.status, payload);
  }

  if (!isJson) {
    throw new Error("Resposta inesperada do servidor");
  }

  return payload as T;
}
