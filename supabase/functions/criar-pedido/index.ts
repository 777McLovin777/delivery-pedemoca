import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const allowedOrigins = new Set([
  "https://delivery-pedemoca.pages.dev",
  "http://localhost:5173",
  "http://localhost:5174",
]);

const baseCorsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin");

  return {
    ...baseCorsHeaders,
    ...(origin && allowedOrigins.has(origin)
      ? { "Access-Control-Allow-Origin": origin }
      : {}),
    Vary: "Origin",
  };
}

const ORDER_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const ORDER_RATE_LIMIT = 10;

async function checkOrderRateLimit(supabaseAdmin: any, identifier: string) {
  const windowStart = new Date(
    Date.now() - ORDER_RATE_LIMIT_WINDOW_MS,
  ).toISOString();

  const { count, error: countError } = await supabaseAdmin
    .from("loyalty_rate_limits")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("identifier", identifier)
    .eq("action", "create_order")
    .gte("created_at", windowStart);

  if (countError) {
    console.error("Erro ao consultar rate limit do checkout:", countError);

    return {
      allowed: false,
      internalError: true,
    };
  }

  if ((count ?? 0) >= ORDER_RATE_LIMIT) {
    return {
      allowed: false,
      internalError: false,
    };
  }

  const { error: insertError } = await supabaseAdmin
    .from("loyalty_rate_limits")
    .insert({
      identifier,
      action: "create_order",
    });

  if (insertError) {
    console.error("Erro ao registrar rate limit do checkout:", insertError);

    return {
      allowed: false,
      internalError: true,
    };
  }

  return {
    allowed: true,
    internalError: false,
  };
}

function errorResponse(
  req: Request,
  status: number,
  code: string,
  message: string,
) {
  return Response.json(
    {
      success: false,
      code,
      message,
    },
    {
      status,
      headers: getCorsHeaders(req),
    },
  );
}

export default {
  fetch: withSupabase(
    {
      auth: ["publishable"],
    },
    async (req, ctx) => {
      if (req.method === "OPTIONS") {
        return new Response("ok", {
          headers: getCorsHeaders(req),
        });
      }

      if (req.method !== "POST") {
        return errorResponse(
          req,
          405,
          "METHOD_NOT_ALLOWED",
          "Método não permitido.",
        );
      }

      try {
        const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
        const clientIp = forwardedFor.split(",")[0]?.trim() || "unknown";

        const encodedIp = new TextEncoder().encode(clientIp);

        const hashBuffer = await crypto.subtle.digest("SHA-256", encodedIp);

        const identifier = Array.from(new Uint8Array(hashBuffer))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");

        const rateLimitResult = await checkOrderRateLimit(
          ctx.supabaseAdmin,
          identifier,
        );

        if (rateLimitResult.internalError) {
          return errorResponse(
            req,
            500,
            "RATE_LIMIT_ERROR",
            "Não foi possível processar o pedido agora. Tente novamente.",
          );
        }

        if (!rateLimitResult.allowed) {
          return Response.json(
            {
              success: false,
              code: "RATE_LIMITED",
              message:
                "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
            },
            {
              status: 429,
              headers: {
                ...getCorsHeaders(req),
                "Retry-After": "300",
              },
            },
          );
        }

        const body = await req.json();

        const customerName =
          typeof body.customerName === "string" ? body.customerName.trim() : "";

        const customerPhone =
          typeof body.customerPhone === "string"
            ? body.customerPhone.replace(/\D/g, "")
            : "";

        const fulfillmentType =
          typeof body.fulfillmentType === "string" ? body.fulfillmentType : "";

        const paymentMethod =
          typeof body.paymentMethod === "string" ? body.paymentMethod : "";

        if (customerName.length === 0 || customerName.length > 120) {
          return errorResponse(
            req,
            400,
            "INVALID_NAME",
            "Informe um nome válido.",
          );
        }

        if (customerPhone.length < 10 || customerPhone.length > 13) {
          return errorResponse(
            req,
            400,
            "INVALID_PHONE",
            "Informe um telefone válido.",
          );
        }

        if (fulfillmentType !== "delivery" && fulfillmentType !== "pickup") {
          return errorResponse(
            req,
            400,
            "INVALID_FULFILLMENT",
            "Tipo de atendimento inválido.",
          );
        }

        if (paymentMethod !== "pix" && paymentMethod !== "cash") {
          return errorResponse(
            req,
            400,
            "INVALID_PAYMENT",
            "Forma de pagamento inválida.",
          );
        }

        if (
          typeof body.checkoutToken !== "string" ||
          body.checkoutToken.trim() === ""
        ) {
          return errorResponse(
            req,
            400,
            "INVALID_CHECKOUT_TOKEN",
            "Identificador do checkout inválido.",
          );
        }

        if (!Array.isArray(body.items) || body.items.length === 0) {
          return errorResponse(
            req,
            400,
            "EMPTY_CART",
            "O carrinho está vazio.",
          );
        }

        if (body.items.length > 50) {
          return errorResponse(
            req,
            400,
            "TOO_MANY_ITEMS",
            "O carrinho possui itens demais.",
          );
        }

        const { data, error } = await ctx.supabaseAdmin.rpc("criar_pedido", {
          p_checkout_token: body.checkoutToken,
          p_customer_name: customerName,
          p_customer_phone: customerPhone,
          p_fulfillment_type: fulfillmentType,

          p_delivery_neighborhood_id:
            fulfillmentType === "delivery"
              ? (body.deliveryNeighborhoodId ?? null)
              : null,

          p_delivery_address:
            fulfillmentType === "delivery"
              ? (body.deliveryAddress ?? null)
              : null,

          p_delivery_number:
            fulfillmentType === "delivery"
              ? (body.deliveryNumber ?? null)
              : null,

          p_delivery_complement:
            fulfillmentType === "delivery"
              ? (body.deliveryComplement ?? null)
              : null,

          p_delivery_reference:
            fulfillmentType === "delivery"
              ? (body.deliveryReference ?? null)
              : null,

          p_pickup_location_id:
            fulfillmentType === "pickup"
              ? (body.pickupLocationId ?? null)
              : null,

          p_payment_method: paymentMethod,

          p_cash_given:
            paymentMethod === "cash" ? (body.cashGiven ?? null) : null,

          p_items: body.items,
        });

        if (error) {
          console.error("Erro ao criar pedido:", error);

          return errorResponse(
            req,
            400,
            "ORDER_CREATION_ERROR",
            "Não foi possível criar o pedido. Verifique os dados e tente novamente.",
          );
        }

        return Response.json(data, {
          status: 200,
          headers: getCorsHeaders(req),
        });
      } catch (error) {
        console.error("Erro inesperado no checkout:", error);

        return errorResponse(
          req,
          400,
          "INVALID_REQUEST",
          "Não foi possível processar a solicitação.",
        );
      }
    },
  ),
};
