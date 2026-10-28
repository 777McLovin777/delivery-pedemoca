import { expect, test } from "./catalog.fixture";

for (const width of [390, 1280]) {
	test(`dados do checkout em ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 850 });
		await page.goto("/cardapio/cookies");
		const product = page
			.locator(".product-card")
			.filter({ hasText: "Cookie Kinder Bueno" })
			.first();
		await product.getByText("Adicionar ao pedido").click();
		await page
			.locator(".brownie-modal")
			.getByRole("button", { name: "Adicionar ao pedido", exact: true })
			.click();
		await page.getByRole("button", { name: /Finalizar pedido/ }).click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		const bounds = await dialog.boundingBox();
		expect(bounds.y).toBeGreaterThanOrEqual(0);
		expect(bounds.y + bounds.height).toBeLessThanOrEqual(851);
		await dialog
			.locator("form.checkout-customer-form")
			.getByRole("button", { name: /^Continuar\s*\u2192$/ })
			.click();
		await expect(dialog.getByLabel("Nome", { exact: true })).toBeFocused();
		await dialog
			.getByLabel("Nome", { exact: true })
			.pressSequentially("Ana Silva");
		await dialog
			.getByLabel("WhatsApp", { exact: true })
			.pressSequentially("(11) 91234-5678");
		await dialog
			.locator("form.checkout-customer-form")
			.getByRole("button", { name: /^Continuar\s*\u2192$/ })
			.click();
		await expect(
			dialog.getByRole("heading", { name: "Como voc\u00ea quer receber?" }),
		).toBeVisible();
		await expect(dialog).not.toHaveClass(
			/checkout-step-(enter|exit)/,
		);
		await dialog.getByRole("button", { name: /Voltar/ }).click();
		await expect(dialog.getByLabel("Nome", { exact: true })).toHaveValue(
			"Ana Silva",
		);
		await expect(dialog.getByLabel("WhatsApp", { exact: true })).toHaveValue(
			"(11) 91234-5678",
		);
		await expect(dialog).not.toHaveClass(
			/checkout-step-(enter|exit)/,
		);
		await page.screenshot({ path: `test-results/checkout-${width}.png` });
		await page.keyboard.press("Escape");
		await expect(dialog).not.toBeVisible();
		await page
			.locator(".product-card")
			.filter({ hasText: "Cookie Kinder Bueno" })
			.first()
			.getByText("Adicionar ao pedido")
			.click();
		await page
			.locator(".brownie-modal")
			.getByRole("button", { name: "Adicionar ao pedido", exact: true })
			.click();
		await page.getByRole("button", { name: /Finalizar pedido/ }).click();
		await expect(dialog.getByLabel("Nome", { exact: true })).toHaveValue(
			"Ana Silva",
		);
		await expect(dialog.getByLabel("WhatsApp", { exact: true })).toHaveValue(
			"(11) 91234-5678",
		);
	});
}
