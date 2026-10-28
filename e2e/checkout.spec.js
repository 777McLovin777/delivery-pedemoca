import { expect, test } from "./fixtures";

async function openCheckout(page) {
  await page.goto("/cardapio/cookies");
  const product = page.locator(".product-card").filter({ hasText: "Cookie Kinder Bueno" }).first();
  await product.getByText("Adicionar ao pedido").click();
  await page.locator(".brownie-modal").getByRole("button", { name: "Adicionar ao pedido", exact: true }).click();
  await page.getByRole("button", { name: /Finalizar pedido/ }).click();
  return page.getByRole("dialog");
}

for (const width of [390, 1280]) {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    test(`page curl em ${width}px, motion ${reducedMotion}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.emulateMedia({ reducedMotion });
      const dialog = await openCheckout(page);
      await expect(dialog).toBeVisible();
      const bounds = await dialog.boundingBox();
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(851);
      await dialog.locator("form.checkout-customer-form").getByRole("button", { name: "Continuar \u2192", exact: true }).click();
      await expect(dialog.getByLabel("Nome", { exact: true })).toBeFocused();
      await dialog.getByLabel("Nome", { exact: true }).fill(" Ana Silva ");
      await dialog.getByLabel("WhatsApp", { exact: true }).fill("11912345678");
      await dialog.locator("form").evaluate((form) => {
        form.requestSubmit();
        form.requestSubmit();
      });
      await expect(dialog).toHaveAttribute("aria-busy", "false");
      await expect(dialog.getByRole("heading", { name: "Como você quer receber?" })).toBeFocused();
      await expect(dialog.locator(".checkout-fixed-header")).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Fechar checkout" })).toBeVisible();
      await dialog.getByRole("button", { name: /Voltar/ }).click();
      await expect(dialog).toHaveAttribute("aria-busy", "false");
      await expect(dialog.getByRole("heading", { name: "Seus dados" })).toBeFocused();
      await expect(dialog.getByLabel("Nome", { exact: true })).toHaveValue("Ana Silva");
      await expect(dialog.getByLabel("WhatsApp", { exact: true })).toHaveValue("(11) 91234-5678");
      const ids = await dialog.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    });
  }
}

test("closing during a curl cancels navigation and restores the opener focus", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const dialog = await openCheckout(page);
  await dialog.getByLabel("Nome", { exact: true }).fill("Ana");
  await dialog.getByLabel("WhatsApp", { exact: true }).fill("11912345678");
  await dialog.locator("form.checkout-customer-form").getByRole("button", { name: "Continuar \u2192", exact: true }).click();
  await expect(dialog).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

for (const width of [390, 1280]) {
  test(`captures the curved sheet at ${width}px without external traffic`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 850 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const dialog = await openCheckout(page);
    await dialog.getByLabel("Nome", { exact: true }).fill("Ana");
    await dialog.getByLabel("WhatsApp", { exact: true }).fill("11912345678");
    await page.evaluate(() => {
      const native = window.requestAnimationFrame;
      const cancel = window.cancelAnimationFrame;
      const pending = new Map();
      let serial = 0;
      let time = performance.now();
      window.requestAnimationFrame = (callback) => { pending.set(++serial, callback); return serial; };
      window.cancelAnimationFrame = (id) => pending.delete(id);
      window.curlClock = {
        step(delta) { time += delta; const callbacks = [...pending.values()]; pending.clear(); for (const cb of callbacks) cb(time); },
        restore() { window.requestAnimationFrame = native; window.cancelAnimationFrame = cancel; },
      };
    });
    await dialog.locator("form.checkout-customer-form").getByRole("button", { name: "Continuar \u2192", exact: true }).click();
    for (const delta of [0, 100, 300]) await page.evaluate((ms) => window.curlClock.step(ms), delta);
    await expect(dialog.locator(".checkout-page-curl")).toBeVisible();
    await expect(dialog.locator(".checkout-page")).toHaveCSS("opacity", "0");
    await expect(dialog.locator(".checkout-fixed-header")).toBeVisible();
    await testInfo.attach("page-curl-middle", { body: await page.screenshot({ path: testInfo.outputPath("page-curl-middle.png") }), contentType: "image/png" });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await page.evaluate(() => window.curlClock.restore());
  });
}

test("delivery and cash checkout require explicit confirmation and only send to a mock", async ({ page, network }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const dialog = await openCheckout(page);
  await dialog.getByLabel("Nome", { exact: true }).fill("Ana");
  await dialog.getByLabel("WhatsApp", { exact: true }).fill("11912345678");
  await dialog.locator("form.checkout-customer-form").getByRole("button", { name: "Continuar \u2192", exact: true }).click();
  await dialog.getByRole("button", { name: /Entrega/ }).click();
  await dialog.getByRole("button", { name: "Continuar \u2192", exact: true }).click();
  await dialog.getByLabel("Bairro", { exact: true }).fill("Centro");
  await dialog.getByLabel("Rua / Avenida").fill("Rua A");
  await dialog.getByLabel("N\u00famero", { exact: true }).fill("10");
  await dialog.getByRole("button", { name: /Calcular entrega/ }).click();
  await expect(dialog.getByRole("heading", { name: "Resumo do pedido" })).toBeFocused();
  await dialog.getByRole("button", { name: "Continuar \u2192", exact: true }).click();
  await dialog.getByRole("button", { name: /Dinheiro/ }).click();
  await dialog.getByRole("button", { name: "N\u00e3o", exact: true }).click();
  await dialog.getByRole("button", { name: "Continuar \u2192", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Revise seu pedido" })).toBeFocused();
  expect(network.orders).toHaveLength(0);
  await dialog.getByRole("button", { name: /Confirmar pedido/ }).evaluate((button) => {
    button.click(); button.click();
  });
  await expect.poll(() => network.orders.length).toBe(1);
});
