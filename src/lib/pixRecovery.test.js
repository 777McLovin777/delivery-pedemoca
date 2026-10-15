import { describe, expect, it } from "vitest";
import { getPixRecoveryAction, selectUniquePixOrder } from "./pixRecovery";

describe("Recuperação segura de tentativas PIX", () => {
  it("recupera um PIX já registrado", () => {
    expect(getPixRecoveryAction({ attempt_status: "pending" })).toBe(
      "return_existing_pix",
    );
  });

  it("consulta uma cobrança existente quando possui ID do provedor", () => {
    expect(
      getPixRecoveryAction({
        attempt_status: "processing",
        provider_order_id: "123456",
      }),
    ).toBe("lookup_existing_order");
  });

  it("não autoriza nova cobrança quando o resultado é desconhecido", () => {
    expect(
      getPixRecoveryAction({
        attempt_status: "processing",
        provider_order_id: null,
      }),
    ).toBe("await_reconciliation");
  });

  it("permite preparar uma tentativa reservada", () => {
    expect(getPixRecoveryAction({ attempt_status: "reserved" })).toBe(
      "prepare_payment",
    );
  });

  it("bloqueia estados não previstos", () => {
    expect(getPixRecoveryAction({ attempt_status: "failed" })).toBe("blocked");
  });

  it("rejeita tentativas inválidas", () => {
    expect(getPixRecoveryAction(null)).toBe("invalid");
  });

  it("bloqueia recuperação quando existem múltiplas cobranças", () => {
    const orders = [
      { id: "123", external_reference: "pedido-1" },
      { id: "456", external_reference: "pedido-1" },
    ];

    expect(() => selectUniquePixOrder(orders, "pedido-1")).toThrow(
      "Resultado ambíguo na recuperação PIX.",
    );
  });

  it("não considera uma busca vazia como cobrança recuperada", () => {
    expect(selectUniquePixOrder([], "pedido-1")).toBeNull();
  });

  it("rejeita uma cobrança pertencente a outro pedido", () => {
    const orders = [{ id: "123", external_reference: "pedido-2" }];

    expect(() => selectUniquePixOrder(orders, "pedido-1")).toThrow(
      "Cobrança não corresponde ao pedido.",
    );
  });
});
