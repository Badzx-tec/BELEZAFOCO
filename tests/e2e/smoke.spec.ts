import { expect, test } from "@playwright/test";

test("landing renders premium messaging", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Sua agenda e o coracao do negocio/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Criar conta gratis/i }).first()).toBeVisible();
});

test("booking public page exposes reserve CTA", async ({ page }) => {
  await page.goto("/b/studio-jardins");
  await expect(page.getByRole("heading", { name: /Studio studio jardins/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Reservar e gerar Pix/i })).toBeVisible();
});

test("cockpit dashboard renders metrics", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByText("Receita hoje")).toBeVisible();
  await expect(page.getByText("Snapshot financeiro")).toBeVisible();
});
