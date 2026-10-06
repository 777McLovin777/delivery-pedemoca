import { expect, test } from "@playwright/test";

for (const width of [390, 1280]) {
	test(`dados do checkout em ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 850 });
		await page.goto("/cardapio/mousses");
		const product = page
			.locator(".product-card")
			.filter({ hasText: "Mousse de Café" })
			.first();
		await product.getByText("Adicionar ao pedido").click();
		await page
			.locator(".brownie-modal")
			.getByRole("button", { name: "Adicionar ao pedido", exact: true })
			.click();
		await page.getByRole("button", { name: /Continuar pedido/ }).click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
      const bounds = await dialog.boundingBox();
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(851);
		await dialog.getByRole("button", { name: "Salvar dados" }).click();
		await expect(dialog.getByLabel("Nome", { exact: true })).toBeFocused();
		await dialog
			.getByLabel("Nome", { exact: true })
			.pressSequentially("Ana Silva");
		await dialog
			.getByLabel("WhatsApp", { exact: true })
			.pressSequentially("(11) 91234-5678");
		await dialog.getByRole("button", { name: "Salvar dados" }).click();
		await expect(dialog.getByRole("status")).toBeVisible();
		await page.screenshot({ path: `test-results/checkout-${width}.png` });
		await page.keyboard.press("Escape");
		await expect(dialog).not.toBeVisible();
		await page
			.locator(".product-card")
			.filter({ hasText: "Mousse de Café" })
			.first()
			.getByText("Adicionar ao pedido")
			.click();
		await page
			.locator(".brownie-modal")
			.getByRole("button", { name: "Adicionar ao pedido", exact: true })
			.click();
		await page.getByRole("button", { name: /Continuar pedido/ }).click();
		await expect(dialog.getByLabel("Nome", { exact: true })).toHaveValue(
			"Ana Silva",
		);
		await expect(dialog.getByLabel("WhatsApp", { exact: true })).toHaveValue(
			"11912345678",
		);
	});
}
