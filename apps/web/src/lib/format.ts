import { ApiError } from "./api";

export function currencyInCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value / 100);
}

export function readableError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message.replaceAll('"', "");
  }
  return "Nao foi possivel concluir a operacao.";
}
