import { describe, expect, it } from "vitest";
import { extractMercadoPagoPixData } from "../../supabase/functions/criar-pix/pixValidation";

const orderId = "pedido-teste-123";

function createPixResponse() {
	return {
		id: "mp-order-123",
		external_reference: orderId,
		status: "action_required",
		status_detail: "waiting_transfer",
		transactions: {
			payments: [
				{
					amount: "25.90",
					status: "action_required",
					status_detail: "waiting_transfer",
					payment_method: {
						id: "pix",
						qr_code: "codigo-pix-teste",
						qr_code_base64: "imagem-base64-teste",
					},
				},
			],
		},
	};
}

describe("Validação real da resposta PIX", () => {
	it("aceita uma cobrança PIX válida", () => {
		const result = extractMercadoPagoPixData(
			createPixResponse(),
			25.9,
			orderId,
		);

		expect(result).toEqual({
			providerOrderId: "mp-order-123",
			pixCode: "codigo-pix-teste",
			qrCodeBase64: "imagem-base64-teste",
		});
	});

	it("rejeita cobrança de outro pedido", () => {
		const response = createPixResponse();
		response.external_reference = "outro-pedido";

		expect(() => extractMercadoPagoPixData(response, 25.9, orderId)).toThrow();
	});

	it("rejeita valor divergente", () => {
		expect(() =>
			extractMercadoPagoPixData(createPixResponse(), 30, orderId),
		).toThrow();
	});

	it("rejeita método diferente de PIX", () => {
		const response = createPixResponse();
		response.transactions.payments[0].payment_method.id = "credit_card";

		expect(() => extractMercadoPagoPixData(response, 25.9, orderId)).toThrow();
	});

	it("rejeita código PIX ausente", () => {
		const response = createPixResponse();
		response.transactions.payments[0].payment_method.qr_code = "";

		expect(() => extractMercadoPagoPixData(response, 25.9, orderId)).toThrow();
	});

	it("não apresenta cobrança já paga como PIX pendente", () => {
		const response = createPixResponse();
		response.status = "processed";
		response.transactions.payments[0].status = "processed";

		expect(() => extractMercadoPagoPixData(response, 25.9, orderId)).toThrow();
	});
});

it("rejeita uma cobrança com múltiplos pagamentos PIX", () => {
    const response = createPixResponse();
    response.transactions.payments.push({
        ...response.transactions.payments[0],
    });

    expect(() =>
        extractMercadoPagoPixData(response, 25.9, orderId),
    ).toThrow();
});

it("rejeita valor PIX com fração de centavo", () => {
    const response = createPixResponse();
    response.transactions.payments[0].amount = "25.904";

    expect(() =>
        extractMercadoPagoPixData(response, 25.9, orderId),
    ).toThrow();
});

it.each([
    ["0.29", 0.29],
    ["1.13", 1.13],
])("aceita valor monetário legítimo de R$ %s", (amount, expectedTotal) => {
    const response = createPixResponse();
    response.transactions.payments[0].amount = amount;

    expect(
        extractMercadoPagoPixData(response, expectedTotal, orderId)
    ).toMatchObject({
        providerOrderId: "mp-order-123",
        pixCode: "codigo-pix-teste",
    });
});
