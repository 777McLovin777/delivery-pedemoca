import { expect, test } from "@playwright/test";

test("cliente adiciona produto ao carrinho com quantidade e observação", async ({
  page,
}) => {
  await page.goto("/cardapio/mousses");

  console.log("E2E URL:", page.url());
  console.log("E2E TITLE:", await page.title());
  console.log(
    "E2E PRODUCT CARDS:",
    await page.locator(".product-card").allTextContents(),
  );

  const productCard = page
    .locator(".product-card")
    .filter({ hasText: "Mousse de Café" })
    .first();

  await expect(productCard).toBeVisible();

  await productCard.getByText("Adicionar ao pedido").click();

  const modal = page.locator(".brownie-modal");

  await expect(modal).toBeVisible();
  await expect(
    modal.getByRole("heading", {
      name: "Mousse de Café",
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
  await expect(cart.getByText("Mousse de Café")).toBeVisible();
  await expect(cart.getByText("Sem açúcar adicional")).toBeVisible();

  const savedCart = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem("pedemoca-cart"));
  });

  expect(savedCart).toHaveLength(1);
  expect(savedCart[0].name).toBe("Mousse de Café");
  expect(savedCart[0].quantity).toBe(2);
  expect(savedCart[0].observation).toBe("Sem açúcar adicional");
});
