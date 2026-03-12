"use client";

const CSRF_COOKIE_NAME = "bf_csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

export async function getJson<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(path, {
    method: "GET",
    credentials: "include"
  });

  return parseJsonResponse<TResponse>(response);
}

export async function postJson<TResponse>(
  path: string,
  body: Record<string, unknown>
): Promise<TResponse> {
  return sendJson<TResponse>("POST", path, body);
}

export async function patchJson<TResponse>(
  path: string,
  body: Record<string, unknown>
): Promise<TResponse> {
  return sendJson<TResponse>("PATCH", path, body);
}

async function sendJson<TResponse>(
  method: "PATCH" | "POST",
  path: string,
  body: Record<string, unknown>
): Promise<TResponse> {
  const csrfToken = readCookie(CSRF_COOKIE_NAME);
  const response = await fetch(path, {
    method,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {})
    },
    body: JSON.stringify(body)
  });

  return parseJsonResponse<TResponse>(response);
}

async function parseJsonResponse<TResponse>(response: Response): Promise<TResponse> {
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      typeof payload.message === "string" ? payload.message : "Nao foi possivel concluir a operacao."
    );
  }

  return payload as TResponse;
}

export function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  for (const chunk of document.cookie.split(";")) {
    const trimmed = chunk.trim();
    if (!trimmed.startsWith(`${name}=`)) {
      continue;
    }

    return decodeURIComponent(trimmed.slice(name.length + 1));
  }

  return null;
}

export function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export function ensureClientToken(cookieName: string) {
  const existing = readCookie(cookieName);
  if (existing) {
    return existing;
  }

  const value = crypto.randomUUID();
  setCookie(cookieName, value, 10 * 60);
  return value;
}

export function toRelativeInternalUrl(input?: string) {
  if (!input) {
    return null;
  }

  try {
    const url = new URL(input);
    return `${url.pathname}${url.search}`;
  } catch {
    return input;
  }
}
