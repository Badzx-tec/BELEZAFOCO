import { expect, test } from "@playwright/test";

test("landing page shows premium hero and niche visuals", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Sua agenda e o coracao do negocio/i })).toBeVisible();
  await expect(page.getByAltText("Mockup premium do cockpit BELEZAFOCO")).toBeVisible();
  await expect(page.getByAltText("Barbearias")).toBeVisible();
  await expect(page.getByRole("button", { name: "Comecar agora" })).toBeVisible();
});

test("auth page exposes real registration and recovery flows", async ({ page }) => {
  await page.goto("/auth");

  await expect(page.getByRole("heading", { name: /Login, registro e onboarding em fluxo real/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar conta" })).toBeVisible();
  await page.getByRole("button", { name: "Recuperar senha" }).click();
  await expect(page.getByRole("button", { name: "Enviar link de redefinicao" })).toBeVisible();
});

test("public booking invalid slug shows production-safe error state", async ({ page }) => {
  await page.goto("/b/slug-inexistente");

  await expect(page.getByRole("heading", { name: /Nao foi possivel carregar a pagina/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
});
