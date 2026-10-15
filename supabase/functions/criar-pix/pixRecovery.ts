export type PixRecoveryAction =
	| "invalid"
	| "return_existing_pix"
	| "lookup_existing_order"
	| "await_reconciliation"
	| "prepare_payment"
	| "blocked";

export function getPixRecoveryAction(attempt: unknown): PixRecoveryAction {
	if (!attempt || typeof attempt !== "object" || Array.isArray(attempt)) {
		return "invalid";
	}

	const data = attempt as Record<string, unknown>;

	if (data.attempt_status === "pending") {
		return "return_existing_pix";
	}

	if (data.attempt_status === "processing") {
		if (
			typeof data.provider_order_id === "string" &&
			data.provider_order_id.trim().length > 0
		) {
			return "lookup_existing_order";
		}

		return "await_reconciliation";
	}

	if (data.attempt_status === "reserved") {
		return "prepare_payment";
	}

	return "blocked";
}

export function selectUniquePixOrder(
	orders: unknown,
	expectedOrderId: string,
): Record<string, unknown> | null {
	if (!Array.isArray(orders)) {
		throw new Error("Resposta inválida na recuperação PIX.");
	}

	if (typeof expectedOrderId !== "string" || !expectedOrderId.trim()) {
		throw new Error("Referência do pedido inválida.");
	}

	if (
		orders.some(
			(order) => !order || typeof order !== "object" || Array.isArray(order),
		)
	) {
		throw new Error("Resultado inválido na recuperação PIX.");
	}

	if (orders.length > 1) {
		throw new Error("Resultado ambíguo na recuperação PIX.");
	}

	if (orders.length === 0) {
		return null;
	}

	const order = orders[0] as Record<string, unknown>;

	if (
		(typeof order.id !== "string" && typeof order.id !== "number") ||
		!String(order.id).trim() ||
		order.external_reference !== expectedOrderId
	) {
		throw new Error("Cobrança não corresponde ao pedido.");
	}

	return order;
}

export function selectPixOrderFromSearch(
	response: unknown,
	expectedOrderId: string,
): Record<string, unknown> | null {
	if (!response || typeof response !== "object" || Array.isArray(response)) {
		throw new Error("Resposta inválida na pesquisa PIX.");
	}

	const result = response as Record<string, unknown>;

	if (!Array.isArray(result.data)) {
		throw new Error("Lista de cobranças inválida.");
	}

	const paging = result.paging;

	if (!paging || typeof paging !== "object" || Array.isArray(paging)) {
		throw new Error("Paginação inválida na pesquisa PIX.");
	}

	const pagination = paging as Record<string, unknown>;

	const parsePaginationInteger = (value: unknown): number => {
		if (
			typeof value !== "number" &&
			(typeof value !== "string" || !/^\d+$/.test(value))
		) {
			return Number.NaN;
		}

		const parsed = Number(value);

		return Number.isSafeInteger(parsed) ? parsed : Number.NaN;
	};

	const total = parsePaginationInteger(pagination.total);
	const limit = parsePaginationInteger(pagination.limit);
	const offset = parsePaginationInteger(pagination.offset);

	if (
		typeof total !== "number" ||
		typeof limit !== "number" ||
		typeof offset !== "number" ||
		!Number.isSafeInteger(total) ||
		!Number.isSafeInteger(limit) ||
		!Number.isSafeInteger(offset) ||
		total < 0 ||
		limit <= 0 ||
		offset !== 0 ||
		result.data.length > limit ||
		total < result.data.length
	) {
		throw new Error("Paginação inválida na pesquisa PIX.");
	}

	// Nunca selecionar uma cobrança se existirem páginas não verificadas.
	if (total > result.data.length) {
		throw new Error("Pesquisa PIX incompleta.");
	}

	return selectUniquePixOrder(result.data, expectedOrderId);
}
