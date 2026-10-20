import { beforeEach, expect, it } from "vitest";
import {
  savePendingCheckout,
  getPendingCheckout,
} from "./pendingCheckout";

const originalPayload = {
  checkoutToken: "123e4567-e89b-42d3-a456-426614174000",
  customerName: "Cliente Teste",
  customerPhone: "11999999999",
  paymentMethod: "pix",
  fulfillmentType: "pickup",
  pickupLocationId: "loja-1",
  items: [{ productId: 101, quantity: 2 }],
};

beforeEach(() => {
  localStorage.clear();
});

it("salva o token e os dados originais da tentativa", () => {
  savePendingCheckout(originalPayload);

  expect(getPendingCheckout(originalPayload)).toEqual(originalPayload);
});

it("recupera uma tentativa após nova leitura do armazenamento", () => {
  savePendingCheckout(originalPayload);

  const recovered = getPendingCheckout({ ...originalPayload });

  expect(recovered?.checkoutToken).toBe(originalPayload.checkoutToken);
  expect(recovered?.items).toEqual(originalPayload.items);
});

it("não reutiliza uma tentativa para uma compra diferente", () => {
  savePendingCheckout(originalPayload);

  const differentPayload = {
    ...originalPayload,
    items: [{ productId: 101, quantity: 3 }],
  };

  expect(getPendingCheckout(differentPayload)).toBeNull();
});

it("recupera a tentativa original sem conhecer o token após atualizar a página", () => {
  savePendingCheckout(originalPayload);

  const { checkoutToken, ...purchaseDetails } = originalPayload;

  const recovered = getPendingCheckout(purchaseDetails);

  expect(recovered?.checkoutToken).toBe(checkoutToken);
  expect(recovered?.items).toEqual(originalPayload.items);
});

it("ignora dados corrompidos no armazenamento", () => {
  localStorage.setItem("pedemoca-pending-checkout", "{json-invalido");

  expect(getPendingCheckout(originalPayload)).toBeNull();
  expect(savePendingCheckout(originalPayload)).toBe(false);
});

it("não recupera uma tentativa armazenada há mais de 30 minutos", () => {
  savePendingCheckout(originalPayload);

  const key = "pedemoca-pending-checkout";
  const saved = JSON.parse(localStorage.getItem(key));
  expect(saved.savedAt).toEqual(expect.any(Number));

  localStorage.setItem(
    key,
    JSON.stringify({
      ...saved,
      savedAt: Date.now() - 31 * 60 * 1000,
    })
  );

  expect(getPendingCheckout(originalPayload)).toBeNull();
});

it("não sobrescreve uma tentativa válida com outra compra", () => {
  savePendingCheckout(originalPayload);

  const differentPayload = {
    ...originalPayload,
    checkoutToken: "223e4567-e89b-42d3-a456-426614174000",
    items: [{ productId: 101, quantity: 3 }],
  };

  expect(savePendingCheckout(differentPayload)).toBe(false);
  expect(getPendingCheckout(originalPayload)).toEqual(originalPayload);
  expect(getPendingCheckout(differentPayload)).toBeNull();
});

it("retorna false quando o armazenamento bloqueia o salvamento", () => {
  const originalSetItem = Storage.prototype.setItem;

  Storage.prototype.setItem = () => {
    throw new Error("Armazenamento indisponível");
  };

  try {
    expect(savePendingCheckout(originalPayload)).toBe(false);
  } finally {
    Storage.prototype.setItem = originalSetItem;
  }
});

it("permite salvar uma nova tentativa quando a anterior expirou", () => {
  expect(savePendingCheckout(originalPayload)).toBe(true);

  const key = "pedemoca-pending-checkout";
  const saved = JSON.parse(localStorage.getItem(key));

  localStorage.setItem(
    key,
    JSON.stringify({ ...saved, savedAt: Date.now() - 31 * 60 * 1000 })
  );

  const newPayload = {
    ...originalPayload,
    checkoutToken: "223e4567-e89b-42d3-a456-426614174000",
    items: [{ productId: 101, quantity: 3 }],
  };

  expect(savePendingCheckout(newPayload)).toBe(true);
  expect(getPendingCheckout(newPayload)).toEqual(newPayload);
});

it("não recupera o token quando o cliente altera os dados da compra", () => {
  expect(savePendingCheckout(originalPayload)).toBe(true);

  const { checkoutToken, ...purchaseDetails } = originalPayload;

  const changedPurchase = {
    ...purchaseDetails,
    customerPhone: "11888888888",
  };

  expect(getPendingCheckout(changedPurchase)).toBeNull();
  expect(getPendingCheckout(purchaseDetails)?.checkoutToken).toBe(checkoutToken);
});

it("reconhece a mesma compra mesmo com propriedades em ordem diferente", () => {
  expect(savePendingCheckout(originalPayload)).toBe(true);

  const reorderedPayload = {
    items: originalPayload.items,
    pickupLocationId: originalPayload.pickupLocationId,
    fulfillmentType: originalPayload.fulfillmentType,
    paymentMethod: originalPayload.paymentMethod,
    customerPhone: originalPayload.customerPhone,
    customerName: originalPayload.customerName,
  };

  expect(getPendingCheckout(reorderedPayload)?.checkoutToken).toBe(
    originalPayload.checkoutToken
  );
});

it("não substitui uma tentativa enviada mesmo após 30 minutos", () => {
  expect(savePendingCheckout(originalPayload)).toBe(true);

  const key = "pedemoca-pending-checkout";
  const saved = JSON.parse(localStorage.getItem(key));

  localStorage.setItem(
    key,
    JSON.stringify({
      ...saved,
      status: "sent",
      savedAt: Date.now() - 31 * 60 * 1000,
    })
  );

  const newPayload = {
    ...originalPayload,
    checkoutToken: "223e4567-e89b-42d3-a456-426614174000",
    items: [{ productId: 101, quantity: 3 }],
  };

  expect(savePendingCheckout(newPayload)).toBe(false);

  const preserved = JSON.parse(localStorage.getItem(key));
  expect(preserved.checkoutToken).toBe(originalPayload.checkoutToken);
  expect(preserved.status).toBe("sent");
});
