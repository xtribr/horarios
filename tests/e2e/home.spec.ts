import { expect, test } from "@playwright/test";

test("home expõe a proposta do MVP", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Montar Horario" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Criar conta" })).toBeVisible();
});
