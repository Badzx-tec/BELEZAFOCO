export function formatCurrency(value?: number | null) {
  if (typeof value !== "number") return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value / 100);
}

export function currencyInCents(value?: number | null) {
  return formatCurrency(value);
}

export function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(new Date(`${value}T12:00:00`));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function nextDateKeys(days: number) {
  const out: string[] = [];
  const now = new Date();

  for (let index = 0; index < days; index += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + index);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    out.push(`${year}-${month}-${day}`);
  }

  return out;
}

export function readableError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Erro inesperado";
}
