import { expect, test } from "@playwright/test";

test("landing page shows premium hero and niche visuals", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Agenda, WhatsApp e Pix/i })).toBeVisible();
  await expect(page.getByAltText("Mockup do dashboard BELEZAFOCO em desktop")).toBeVisible();
  await expect(page.getByAltText("Barbearias")).toBeVisible();
});

test("dashboard loads core operational cards", async ({ page }) => {
  await page.goto("/app");

  await expect(page.getByRole("heading", { level: 2, name: "Studio Beleza Foco" })).toBeVisible();
  await expect(page.getByText("Radar de operacao")).toBeVisible();
  await expect(page.getByText("Lista de espera")).toBeVisible();
});

test("public booking demo completes Pix-oriented reservation", async ({ page }) => {
  await page.goto("/b/demo-beleza");

  await page.getByRole("button", { name: /Manicure em Gel/i }).click();
  await page.getByRole("button", { name: /12:15 Camila Rocha/i }).click();
  await page.getByRole("textbox", { name: /Nome/i }).fill("Ana Demo");
  await page.getByRole("textbox", { name: /WhatsApp/i }).fill("+5511999998888");
  await page.getByRole("textbox", { name: /E-mail/i }).fill("ana@demo.local");
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();

  await expect(page.getByRole("heading", { name: /Falta so concluir o Pix/i })).toBeVisible();
  await expect(page.getByText(/Pix copia e cola/i)).toBeVisible();
});
