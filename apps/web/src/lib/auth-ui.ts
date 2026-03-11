export function normalizeWorkspaceSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildPublicBookingUrl(origin: string | null | undefined, slug: string) {
  const safeOrigin = (origin ?? "").trim().replace(/\/+$/, "");
  const safeSlug = normalizeWorkspaceSlug(slug) || "seu-negocio";

  if (!safeOrigin) {
    return `/b/${safeSlug}`;
  }

  return `${safeOrigin}/b/${safeSlug}`;
}
