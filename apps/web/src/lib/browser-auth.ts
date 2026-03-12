"use client";

export async function postJson<TResponse>(
  path: string,
  body: Record<string, unknown>
): Promise<TResponse> {
  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

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
