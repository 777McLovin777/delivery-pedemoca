function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireMercadoPagoOrderId(response: unknown): string {
	if (!isRecord(response)) {
		throw new Error("Resposta inválida do Mercado Pago.");
	}

	const orderId = response.id;

	if (
		(typeof orderId !== "string" && typeof orderId !== "number") ||
		!String(orderId).trim()
	) {
		throw new Error("Identificador do pagamento não encontrado.");
	}

	return String(orderId);
}

function getNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();

	return trimmed.length > 0 ? trimmed : null;
}

function getFirstMercadoPagoPayment(
	response: unknown,
): Record<string, unknown> {
	if (!isRecord(response)) {
		throw new Error("Resposta inválida do Mercado Pago.");
	}

	const transactions = response.transactions;

	if (!isRecord(transactions)) {
		throw new Error("Transações não encontradas na resposta.");
	}

	const payments = transactions.payments;

	if (!Array.isArray(payments) || payments.length !== 1 || !isRecord(payments[0])) {
		throw new Error("Pagamento não encontrado na resposta.");
	}

	return payments[0];
}

function getMercadoPagoPaymentMethod(
	payment: Record<string, unknown>,
): Record<string, unknown> {
	const paymentMethod = payment.payment_method;

	if (!isRecord(paymentMethod)) {
		throw new Error(
			"Método de pagamento não encontrado na resposta do Mercado Pago.",
		);
	}

	if (paymentMethod.id !== "pix") {
		throw new Error("O pagamento retornado não utiliza PIX.");
	}

	return paymentMethod;
}

export function extractMercadoPagoPixData(
	response: unknown,
	expectedTotal: number,
	expectedOrderId: string,
) {
	const providerOrderId = requireMercadoPagoOrderId(response);

	if (!isRecord(response) || response.external_reference !== expectedOrderId) {
		throw new Error("A referência do Mercado Pago não corresponde ao pedido.");
	}

	const payment = getFirstMercadoPagoPayment(response);
	const paymentMethod = getMercadoPagoPaymentMethod(payment);

	if (
		response.status !== "action_required" ||
		response.status_detail !== "waiting_transfer" ||
		payment.status !== "action_required" ||
		payment.status_detail !== "waiting_transfer"
	) {
		throw new Error("A cobrança PIX não está aguardando pagamento.");
	}

	const paymentAmount = Number(payment.amount);

	if (
		!Number.isFinite(paymentAmount) ||
		(!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(String(payment.amount)) || !Number.isFinite(expectedTotal) || !Number.isSafeInteger(Math.round(expectedTotal * 100)) || Math.round(paymentAmount * 100) !== Math.round(expectedTotal * 100))
	) {
		throw new Error(
			"O valor retornado pelo Mercado Pago não corresponde ao pedido.",
		);
	}

	const pixCode = getNonEmptyString(paymentMethod.qr_code);
	const qrCodeBase64 = getNonEmptyString(paymentMethod.qr_code_base64);

	if (!pixCode) {
		throw new Error("Código PIX não encontrado na resposta do Mercado Pago.");
	}

	return {
		providerOrderId,
		pixCode,
		qrCodeBase64,
	};
}
