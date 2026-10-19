import { expect, it } from "vitest";
import { isValidOrderResponse } from "./orderResponse";

it("aceita uma resposta válida de criação de pedido", () => {
  const response = {
    success: true,
    order_id: "123e4567-e89b-42d3-a456-426614174000",
    order_number: 123,
    total: 25.9,
  };

  expect(isValidOrderResponse(response)).toBe(true);
});

it("rejeita respostas inválidas ou incompletas", () => {
  expect(isValidOrderResponse(null)).toBe(false);
  expect(isValidOrderResponse({ success: false })).toBe(false);
  expect(isValidOrderResponse({ success: true })).toBe(false);
  expect(
    isValidOrderResponse({
      success: true,
      order_id: "123e4567-e89b-42d3-a456-426614174000",
      order_number: 123,
      total: null,
    }),
  ).toBe(false);
});
