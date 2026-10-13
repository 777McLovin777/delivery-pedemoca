import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

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
  orderId: string,
  total: number,
  payerEmail: string,
  idempotencyKey: string,
) {
  if (!PIX_CHARGES_ENABLED) {
    throw new Error("Cobranças PIX estão desativadas.");
  }

  const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

  if (!accessToken) {
    throw new Error("Credencial do Mercado Pago não configurada.");
  }

  const request = buildMercadoPagoPixRequest(
    orderId,
    total,
    payerEmail,
    idempotencyKey,
  );

  const response = await fetch(request.url, {
    method: "POST",
    headers: {
      ...request.headers,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request.body),
    signal: AbortSignal.timeout(15000),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Erro na API do Mercado Pago:", {
      status: response.status,
    });

    throw new Error("Não foi possível gerar o pagamento PIX.");
  }

  return result;
}

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

  if (!Array.isArray(payments) || !isRecord(payments[0])) {
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

function extractMercadoPagoPixData(
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
    Math.round(paymentAmount * 100) !== Math.round(expectedTotal * 100)
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
      if (attempt.attempt_status === "pending") {
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

      // Uma cobrança pode já ter sido iniciada.
      // Nunca criar outra cobrança automaticamente neste estado.
      if (attempt.attempt_status === "processing") {
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
      if (attempt.attempt_status !== "reserved") {
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

      void savePixResponse;

      // Ainda não chamar o Mercado Pago.
      return respond(req, 202, {
        success: true,
        readyForPix: false,
        orderNumber: order.order_number,
        total,
        attemptStatus: "processing",
        message: "Tentativa PIX assumida. Cobrança ainda não ativada.",
      });
    } catch (error) {
      console.error("Erro inesperado ao preparar PIX:", error);

      return respond(req, 500, {
        success: false,
        error: "Não foi possível preparar o pagamento PIX.",
      });
    }
  }),
};
