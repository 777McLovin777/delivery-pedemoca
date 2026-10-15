import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import {
	getPixRecoveryAction,
	selectPixOrderFromSearch,
} from "./pixRecovery.ts";
import { extractMercadoPagoPixData } from "./pixValidation.ts";

const allowedOrigins = new Set([
	"https://delivery-pedemoca.pages.dev",
	"http://localhost:5173",
	"http://localhost:5174",
]);

function corsHeaders(req: Request) {
	const origin = req.headers.get("origin");

	return {
		"Access-Control-Allow-Headers":
			"authorization, x-client-info, apikey, content-type",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		...(origin && allowedOrigins.has(origin)
			? { "Access-Control-Allow-Origin": origin }
			: {}),
		Vary: "Origin",
	};
}

function respond(req: Request, status: number, body: Record<string, unknown>) {
	return Response.json(body, {
		status,
		headers: corsHeaders(req),
	});
}

const uuidPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Trava temporária: não permite gerar cobranças.
const PIX_CHARGES_ENABLED = false;
function buildMercadoPagoPixRequest(
	orderId: string,
	total: number,
	payerEmail: string,
	idempotencyKey: string,
) {
	const amount = total.toFixed(2);

	return {
		url: "https://api.mercadopago.com/v1/orders",

		headers: {
			"Content-Type": "application/json",
			"X-Idempotency-Key": idempotencyKey,
		},

		body: {
			type: "online",
			processing_mode: "automatic",
			external_reference: orderId,
			total_amount: amount,

			payer: {
				email: payerEmail.trim(),
			},

			transactions: {
				payments: [
					{
						amount,
						payment_method: {
							id: "pix",
							type: "bank_transfer",
						},
					},
				],
			},
		},
	};
}

async function sendMercadoPagoPixRequest(
	requestBody: Record<string, unknown>,
	idempotencyKey: string,
) {
	if (!PIX_CHARGES_ENABLED) {
		throw new Error("Cobranças PIX estão desativadas.");
	}

	const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

	if (!accessToken) {
		throw new Error("Credencial do Mercado Pago não configurada.");
	}

	const request = {
		url: "https://api.mercadopago.com/v1/orders",
		headers: {
			"Content-Type": "application/json",
			"X-Idempotency-Key": idempotencyKey,
		},
		body: requestBody,
	};

	let response: Response;

	try {
		response = await fetch(request.url, {
			method: "POST",
			headers: {
				...request.headers,
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify(request.body),
			signal: AbortSignal.timeout(15000),
		});
	} catch (error) {
		console.error("Falha de comunicação com o Mercado Pago:", {
			errorType: error instanceof Error ? error.name : "unknown",
		});

		throw new Error(
			"Não foi possível confirmar a resposta do Mercado Pago. " +
				"A tentativa PIX deve permanecer em processamento.",
		);
	}

	let result: unknown;

	try {
		result = await response.json();
	} catch {
		console.error("Resposta JSON inválida do Mercado Pago:", {
			status: response.status,
		});

		throw new Error(
			"Não foi possível interpretar a resposta do Mercado Pago. " +
				"O estado da cobrança precisa ser verificado.",
		);
	}

	if (!response.ok) {
		console.error("Erro HTTP na API do Mercado Pago:", {
			status: response.status,
		});

		throw new Error("O Mercado Pago não confirmou a criação do pagamento PIX.");
	}

	if (!isRecord(result)) {
		throw new Error(
			"Resposta inesperada do Mercado Pago. " +
				"O estado da cobrança precisa ser verificado.",
		);
	}

	return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getMercadoPagoOrder(providerOrderId: string): Promise<unknown> {
	const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

	if (!accessToken) {
		throw new Error("Credencial do Mercado Pago não configurada.");
	}

	const response = await fetch(
		`https://api.mercadopago.com/v1/orders/${encodeURIComponent(providerOrderId)}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			signal: AbortSignal.timeout(15000),
		},
	);

	if (!response.ok) {
		console.error("Falha ao consultar ordem no Mercado Pago:", {
			status: response.status,
		});

		throw new Error("Não foi possível consultar a cobrança no Mercado Pago.");
	}

	return await response.json();
}

async function recoverMercadoPagoPix(
	providerOrderId: string,
	expectedTotal: number,
	expectedOrderId: string,
) {
	const response = await getMercadoPagoOrder(providerOrderId);

	const pixData = extractMercadoPagoPixData(
		response,
		expectedTotal,
		expectedOrderId,
	);

	if (pixData.providerOrderId !== providerOrderId) {
		throw new Error(
			"A cobrança recuperada não corresponde à ordem solicitada.",
		);
	}

	return pixData;
}

export default {
	fetch: withSupabase({ auth: ["publishable"] }, async (req, ctx) => {
		if (req.method === "OPTIONS") {
			return new Response("ok", {
				headers: corsHeaders(req),
			});
		}

		if (req.method !== "POST") {
			return respond(req, 405, {
				success: false,
				error: "Método não permitido.",
			});
		}

		try {
			const body = await req.json().catch(() => null);

			const orderId = body?.orderId;
			const checkoutToken = body?.checkoutToken;
			const payerEmail = body?.payerEmail;

			if (
				typeof orderId !== "string" ||
				!uuidPattern.test(orderId) ||
				typeof checkoutToken !== "string" ||
				!uuidPattern.test(checkoutToken) ||
				typeof payerEmail !== "string" ||
				payerEmail.length > 254 ||
				!emailPattern.test(payerEmail.trim())
			) {
				return respond(req, 400, {
					success: false,
					error: "Dados do pagamento inválidos.",
				});
			}

			const { data: order, error } = await ctx.supabaseAdmin
				.from("orders")
				.select(
					"id, order_number, total, status, payment_method, payment_status, payment_reference",
				)
				.eq("id", orderId)
				.eq("checkout_token", checkoutToken)
				.maybeSingle();

			if (error) {
				console.error("Erro ao consultar pedido PIX:", error);

				return respond(req, 500, {
					success: false,
					error: "Não foi possível consultar o pedido.",
				});
			}

			if (!order) {
				return respond(req, 404, {
					success: false,
					error: "Pedido não encontrado.",
				});
			}

			if (order.payment_method !== "pix") {
				return respond(req, 400, {
					success: false,
					error: "Este pedido não utiliza PIX.",
				});
			}

			if (order.status === "cancelled" || order.status === "refunded") {
				return respond(req, 409, {
					success: false,
					error: "Este pedido não permite pagamento.",
				});
			}

			if (order.payment_status !== "pending") {
				return respond(req, 409, {
					success: false,
					error: "Este pedido não está aguardando pagamento.",
				});
			}

			const total = Number(order.total);

			if (!Number.isFinite(total) || total <= 0) {
				return respond(req, 400, {
					success: false,
					error: "O valor do pedido é inválido.",
				});
			}

			// Reserva ou recupera a tentativa PIX deste pedido.
			// A operação é atômica no PostgreSQL.
			const { data: attempts, error: reservationError } =
				await ctx.supabaseAdmin.rpc("reserve_pix_payment_attempt", {
					p_order_id: orderId,
					p_checkout_token: checkoutToken,
				});

			if (reservationError) {
				console.error("Erro ao reservar tentativa PIX:", reservationError);

				return respond(req, 409, {
					success: false,
					error: "Não foi possível preparar o pagamento deste pedido.",
				});
			}

			const attempt = Array.isArray(attempts) ? attempts[0] : null;

			if (
				!attempt ||
				typeof attempt.attempt_id !== "string" ||
				typeof attempt.idempotency_key !== "string"
			) {
				return respond(req, 500, {
					success: false,
					error: "Não foi possível identificar a tentativa PIX.",
				});
			}

			// Recupera os dados de uma cobrança PIX já registrada.
			const recoveryAction = getPixRecoveryAction(attempt);
			if (recoveryAction === "return_existing_pix") {
				if (
					typeof attempt.provider_order_id !== "string" ||
					!attempt.provider_order_id.trim() ||
					attempt.provider_order_id !== order.payment_reference ||
					typeof attempt.pix_code !== "string" ||
					!attempt.pix_code.trim()
				) {
					return respond(req, 409, {
						success: false,
						readyForPix: false,
						attemptStatus: "pending",
						error: "Pagamento registrado sem código PIX disponível.",
					});
				}

				return respond(req, 200, {
					success: true,
					readyForPix: true,
					orderNumber: order.order_number,
					total,
					attemptStatus: "pending",
					pixCode: attempt.pix_code,
					qrCodeBase64: attempt.qr_code_base64 ?? null,
					message: "Código PIX recuperado com sucesso.",
				});
			}

			// Consulta uma cobrança existente sem criar outra.
			if (recoveryAction === "lookup_existing_order") {
				try {
					const pixData = await recoverMercadoPagoPix(
						attempt.provider_order_id,
						total,
						orderId,
					);

					const { data: saved, error: saveError } = await ctx.supabaseAdmin.rpc(
						"save_pix_payment_response",
						{
							p_attempt_id: attempt.attempt_id,
							p_idempotency_key: attempt.idempotency_key,
							p_provider_order_id: pixData.providerOrderId,
							p_pix_code: pixData.pixCode,
							p_qr_code_base64: pixData.qrCodeBase64,
						},
					);

					if (saveError || saved !== true) {
						// Outra requisição pode ter registrado a cobrança primeiro.
						// Consultamos novamente o pedido e a tentativa antes de responder.
						const { data: currentOrder, error: orderReadError } =
							await ctx.supabaseAdmin
								.from("orders")
								.select("payment_reference, payment_status, payment_method")
								.eq("id", orderId)
								.eq("checkout_token", checkoutToken)
								.maybeSingle();

						const { data: currentAttempt, error: attemptReadError } =
							await ctx.supabaseAdmin
								.from("pix_payment_attempts")
								.select("status, provider_order_id, pix_code, qr_code_base64")
								.eq("id", attempt.attempt_id)
								.eq("order_id", orderId)
								.eq("idempotency_key", attempt.idempotency_key)
								.maybeSingle();

						if (
							!orderReadError &&
							!attemptReadError &&
							currentOrder?.payment_method === "pix" &&
							currentOrder?.payment_status === "pending" &&
							currentOrder?.payment_reference === pixData.providerOrderId &&
							currentAttempt?.status === "pending" &&
							currentAttempt?.provider_order_id === pixData.providerOrderId &&
							typeof currentAttempt?.pix_code === "string" &&
							currentAttempt.pix_code.trim()
						) {
							return respond(req, 200, {
								success: true,
								readyForPix: true,
								orderNumber: order.order_number,
								total,
								attemptStatus: "pending",
								pixCode: currentAttempt.pix_code,
								qrCodeBase64: currentAttempt.qr_code_base64 ?? null,
								message: "Código PIX já registrado e recuperado com sucesso.",
							});
						}

						throw new Error(
							"Não foi possível confirmar o registro da cobrança PIX recuperada.",
						);
					}

					console.info("Cobrança PIX existente localizada e validada.", {
						orderId,
						providerOrderId: pixData.providerOrderId,
					});

					return respond(req, 200, {
						success: true,
						readyForPix: true,
						orderNumber: order.order_number,
						total,
						attemptStatus: "pending",
						pixCode: pixData.pixCode,
						qrCodeBase64: pixData.qrCodeBase64 ?? null,
						message: "Código PIX recuperado e registrado com sucesso.",
					});
				} catch (error) {
					console.error("Falha na recuperação da cobrança PIX:", error);

					return respond(req, 202, {
						success: true,
						readyForPix: false,
						orderNumber: order.order_number,
						total,
						attemptStatus: "processing",
						message:
							"Não foi possível concluir a consulta. A tentativa permanece protegida.",
					});
				}
			}

			// Uma cobrança pode já ter sido iniciada.
			// Nunca criar outra cobrança automaticamente neste estado.
			if (
				recoveryAction === "await_reconciliation" ||
				recoveryAction === "lookup_existing_order"
			) {
				// A recuperação segura exige a requisição original.
				if (
					typeof attempt.payer_email !== "string" ||
					!attempt.payer_email.trim() ||
					!isRecord(attempt.request_payload)
				) {
					return respond(req, 409, {
						success: false,
						readyForPix: false,
						attemptStatus: "processing",
						error:
							"Tentativa PIX sem dados suficientes para recuperação automática.",
					});
				}

				return respond(req, 202, {
					success: true,
					readyForPix: false,
					orderNumber: order.order_number,
					total,
					attemptStatus: "processing",
					message:
						"Pagamento em processamento. Aguardando recuperação da tentativa PIX.",
				});
			}

			// Somente uma tentativa reservada pode iniciar uma cobrança.
			if (recoveryAction !== "prepare_payment") {
				return respond(req, 409, {
					success: false,
					readyForPix: false,
					attemptStatus: attempt.attempt_status,
					error:
						"Esta tentativa PIX não está disponível para iniciar uma cobrança.",
				});
			}

			// Nenhuma cobrança é realizada nesta etapa.
			if (!PIX_CHARGES_ENABLED) {
				return respond(req, 200, {
					success: true,
					readyForPix: false,
					orderNumber: order.order_number,
					total,
					attemptStatus: attempt.attempt_status,
					message: "Cobranças PIX temporariamente desativadas.",
				});
			}

			// Recupera o snapshot imutável, quando já existir.
			const hasSavedEmail = attempt.payer_email !== null;
			const hasSavedPayload = attempt.request_payload !== null;

			// Um snapshot parcialmente salvo não pode iniciar cobrança.
			if (hasSavedEmail !== hasSavedPayload) {
				return respond(req, 409, {
					success: false,
					readyForPix: false,
					error: "A tentativa PIX possui dados incompletos.",
				});
			}

			const snapshotExists = hasSavedEmail && hasSavedPayload;

			if (
				snapshotExists &&
				(typeof attempt.payer_email !== "string" ||
					!emailPattern.test(attempt.payer_email) ||
					!isRecord(attempt.request_payload))
			) {
				return respond(req, 409, {
					success: false,
					readyForPix: false,
					error: "O snapshot PIX armazenado é inválido.",
				});
			}

			// O e-mail original não pode ser substituído por outro.
			const effectivePayerEmail = snapshotExists
				? (attempt.payer_email as string)
				: payerEmail.trim();

			// Reconstrói a requisição esperada a partir do pedido atual.
			const pixRequest = buildMercadoPagoPixRequest(
				orderId,
				total,
				effectivePayerEmail,
				attempt.idempotency_key,
			);

			// Compara o snapshot salvo com a requisição esperada.
			// A comparação considera o conteúdo, não a ordem das propriedades.
			if (snapshotExists) {
				const savedPayload = attempt.request_payload as Record<string, unknown>;

				const normalize = (value: unknown): unknown => {
					if (Array.isArray(value)) {
						return value.map(normalize);
					}

					if (isRecord(value)) {
						return Object.fromEntries(
							Object.entries(value)
								.sort(([a], [b]) => a.localeCompare(b))
								.map(([key, item]) => [key, normalize(item)]),
						);
					}

					return value;
				};

				if (
					JSON.stringify(normalize(savedPayload)) !==
					JSON.stringify(normalize(pixRequest.body))
				) {
					return respond(req, 409, {
						success: false,
						readyForPix: false,
						error: "O snapshot PIX não corresponde aos dados do pedido.",
					});
				}
			}

			// Preserva a requisição antes de iniciar qualquer cobrança.
			const { data: prepared, error: prepareError } =
				await ctx.supabaseAdmin.rpc("prepare_pix_request", {
					p_attempt_id: attempt.attempt_id,
					p_idempotency_key: attempt.idempotency_key,
					p_payer_email: effectivePayerEmail,
					p_request_payload: pixRequest.body,
				});

			if (prepareError) {
				console.error("Erro ao preparar requisição PIX:", prepareError);

				return respond(req, 500, {
					success: false,
					readyForPix: false,
					error: "Não foi possível preparar a cobrança PIX.",
				});
			}

			if (prepared !== true) {
				return respond(req, 409, {
					success: false,
					readyForPix: false,
					error: "Esta tentativa PIX não pôde ser preparada.",
				});
			}

			// Assume a tentativa de forma atômica antes de iniciar a cobrança.
			const { data: claimed, error: claimError } = await ctx.supabaseAdmin.rpc(
				"claim_pix_payment_attempt",
				{
					p_attempt_id: attempt.attempt_id,
					p_idempotency_key: attempt.idempotency_key,
				},
			);

			if (claimError) {
				console.error("Erro ao assumir tentativa PIX:", claimError);

				return respond(req, 500, {
					success: false,
					readyForPix: false,
					error: "Não foi possível iniciar o processamento PIX.",
				});
			}

			if (claimed !== true) {
				return respond(req, 409, {
					success: false,
					readyForPix: false,
					error: "Esta tentativa PIX já está sendo processada.",
				});
			}

			const savePixResponse = async (mercadoPagoResponse: unknown) => {
				const pixData = extractMercadoPagoPixData(
					mercadoPagoResponse,
					total,
					orderId,
				);

				const { data: saved, error: saveError } = await ctx.supabaseAdmin.rpc(
					"save_pix_payment_response",
					{
						p_attempt_id: attempt.attempt_id,
						p_idempotency_key: attempt.idempotency_key,
						p_provider_order_id: pixData.providerOrderId,
						p_pix_code: pixData.pixCode,
						p_qr_code_base64: pixData.qrCodeBase64,
					},
				);

				if (saveError || saved !== true) {
					console.error("Falha ao salvar cobrança PIX:", {
						databaseError: Boolean(saveError),
					});

					throw new Error("Não foi possível registrar a cobrança PIX.");
				}

				return pixData;
			};

			// Esta chamada permanece inacessível enquanto
			// PIX_CHARGES_ENABLED estiver definido como false.
			try {
				const mercadoPagoResponse = await sendMercadoPagoPixRequest(
					pixRequest.body,
					attempt.idempotency_key,
				);

				const pixData = await savePixResponse(mercadoPagoResponse);

				return respond(req, 200, {
					success: true,
					readyForPix: true,
					orderNumber: order.order_number,
					total,
					attemptStatus: "pending",
					pixCode: pixData.pixCode,
					qrCodeBase64: pixData.qrCodeBase64,
					message: "Código PIX gerado com sucesso.",
				});
			} catch (error) {
				console.error("Falha ao processar tentativa PIX:", {
					errorType: error instanceof Error ? error.name : "unknown",
				});

				// A cobrança pode existir no Mercado Pago.
				// Não criar outra tentativa nem repetir o POST.
				return respond(req, 202, {
					success: false,
					readyForPix: false,
					orderNumber: order.order_number,
					total,
					attemptStatus: "processing",
					message:
						"Não foi possível confirmar a cobrança PIX. " +
						"A tentativa permanece em processamento para verificação.",
				});
			}
		} catch (error) {
			console.error("Erro inesperado ao preparar PIX:", error);

			return respond(req, 500, {
				success: false,
				error: "Não foi possível preparar o pagamento PIX.",
			});
		}
	}),
};
