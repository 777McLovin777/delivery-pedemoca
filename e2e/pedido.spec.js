import { expect, test } from "./catalog.fixture";

test("cliente adiciona produto ao carrinho com quantidade e observação", async ({
	page,
}) => {
	await page.goto("/cardapio/cookies");

	const productCard = page
		.locator(".product-card")
		.filter({ hasText: "Cookie Kinder Bueno" })
		.first();

	await expect(productCard).toBeVisible();

	await productCard.getByText("Adicionar ao pedido").click();

	const modal = page.locator(".brownie-modal");

	await expect(modal).toBeVisible();
	await expect(
		modal.getByRole("heading", {
			name: "Cookie Kinder Bueno",
		}),
	).toBeVisible();

	const quantityControls = modal
		.locator(".product-modal-quantity")
		.locator(".complement-quantity");

	await quantityControls.getByRole("button", { name: "+" }).click();

	await expect(quantityControls.getByText("2")).toBeVisible();

	const observation = modal.getByPlaceholder(
		"Alguma observação sobre este produto?",
	);

	await observation.fill("Sem açúcar adicional");

	await expect(observation).toHaveValue("Sem açúcar adicional");

	await modal
		.getByRole("button", {
			name: "Adicionar ao pedido",
		})
		.click();

	const cart = page.locator(".cart");

	await expect(cart).toBeVisible();
	await expect(cart.getByText("Cookie Kinder Bueno")).toBeVisible();
	await expect(cart.getByText("Sem açúcar adicional")).toBeVisible();

	const savedCart = await page.evaluate(() => {
		return JSON.parse(localStorage.getItem("pedemoca-cart"));
	});

	expect(savedCart).toHaveLength(1);
	expect(savedCart[0].name).toBe("Cookie Kinder Bueno");
	expect(savedCart[0].quantity).toBe(2);
	expect(savedCart[0].observation).toBe("Sem açúcar adicional");
});
