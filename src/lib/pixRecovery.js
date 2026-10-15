export function getPixRecoveryAction(attempt) {
  if (!attempt || typeof attempt !== "object") {
    return "invalid";
  }

  if (attempt.attempt_status === "pending") {
    return "return_existing_pix";
  }

  if (attempt.attempt_status === "processing") {
    if (
      typeof attempt.provider_order_id === "string" &&
      attempt.provider_order_id.trim()
    ) {
      return "lookup_existing_order";
    }

    return "await_reconciliation";
  }

  if (attempt.attempt_status === "reserved") {
    return "prepare_payment";
  }

  return "blocked";
}

export function selectUniquePixOrder(orders, expectedOrderId) {
  if (!Array.isArray(orders)) {
    throw new Error("Resposta inválida na recuperação PIX.");
  }

  if (typeof expectedOrderId !== "string" || !expectedOrderId.trim()) {
    throw new Error("Referência do pedido inválida.");
  }

  // Não podemos ignorar cobranças desconhecidas.
  if (
    orders.some(
      (order) => !order || typeof order !== "object" || Array.isArray(order),
    )
  ) {
    throw new Error("Resultado inválido na recuperação PIX.");
  }

  // Mais de uma cobrança exige investigação.
  if (orders.length > 1) {
    throw new Error("Resultado ambíguo na recuperação PIX.");
  }

  if (orders.length === 0) {
    return null;
  }

  const order = orders[0];

  if (
    (typeof order.id !== "string" && typeof order.id !== "number") ||
    !String(order.id).trim() ||
    order.external_reference !== expectedOrderId
  ) {
    throw new Error("Cobrança não corresponde ao pedido.");
  }

  return order;
}
