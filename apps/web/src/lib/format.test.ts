import { describe, expect, it } from "vitest";
import { ApiError } from "./api";
import { currencyInCents, readableError } from "./format";

describe("format helpers", () => {
  it("formata centavos em BRL", () => {
    expect(currencyInCents(8900)).toContain("89");
  });

  it("extrai mensagem amigavel de erro", () => {
    expect(readableError(new Error("falha"))).toBe("falha");
  });

  it("prioriza mensagem de erro da API", () => {
    expect(readableError(new ApiError("Sessao expirada.", 401))).toBe("Sessao expirada.");
  });
});
