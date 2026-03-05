const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
