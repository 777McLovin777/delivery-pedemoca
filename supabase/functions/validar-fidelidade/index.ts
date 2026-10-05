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

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

const RATE_LIMITS = {
  validate: 10,
  status: 30,
};

async function checkRateLimit(
  supabaseAdmin: any,
  identifier: string,
  action: "validate" | "status",
) {
  const limit = RATE_LIMITS[action];

  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MS,
  ).toISOString();

  const { count, error: countError } = await supabaseAdmin
    .from("loyalty_rate_limits")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("identifier", identifier)
    .eq("action", action)
    .gte("created_at", windowStart);

  if (countError) {
    console.error("Erro ao consultar rate limit:", countError);

    return {
      allowed: false,
      internalError: true,
    };
  }

  if ((count ?? 0) >= limit) {
    return {
      allowed: false,
      internalError: false,
    };
  }

  const { error: insertError } = await supabaseAdmin
    .from("loyalty_rate_limits")
    .insert({
      identifier,
      action,
    });

  if (insertError) {
    console.error("Erro ao registrar rate limit:", insertError);

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

export default {
  fetch: withSupabase(
    {
      auth: ["publishable"],
      cors: "disabled",
    },
    async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: getCorsHeaders(req),
      });
    }

    if (req.method !== "POST") {
      return Response.json(
        {
          success: false,
          code: "METHOD_NOT_ALLOWED",
          message: "Método não permitido.",
        },
        {
          status: 405,
          headers: getCorsHeaders(req),
        },
      );
    }

    try {
      const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
      const clientIp = forwardedFor.split(",")[0]?.trim() || "unknown";

      const encodedIp = new TextEncoder().encode(clientIp);
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        encodedIp,
      );

      const identifier = Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      const body = await req.json();

      const action =
        typeof body.action === "string"
          ? body.action.trim()
          : "validate";

      if (action !== "validate" && action !== "status") {
        return Response.json(
          {
            success: false,
            code: "INVALID_ACTION",
            message: "Ação inválida.",
          },
          {
            status: 400,
            headers: getCorsHeaders(req),
          },
        );
      }

      const rateLimitResult = await checkRateLimit(
        ctx.supabaseAdmin,
        identifier,
        action,
      );

      if (rateLimitResult.internalError) {
        return Response.json(
          {
            success: false,
            code: "RATE_LIMIT_ERROR",
            message: "Não foi possível processar a solicitação agora.",
          },
          {
            status: 500,
            headers: getCorsHeaders(req),
          },
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

      const phone =
        typeof body.phone === "string"
          ? body.phone.trim()
          : "";

      const normalizedPhone = phone.replace(/\D/g, "");

      if (
        normalizedPhone.length < 10 ||
        normalizedPhone.length > 13
      ) {
        return Response.json(
          {
            success: false,
            code: "INVALID_PHONE",
            message: "Informe um telefone válido.",
          },
          {
            status: 400,
            headers: getCorsHeaders(req),
          },
        );
      }

      const orderNumber = Number(body.orderNumber);

      if (
        !Number.isSafeInteger(orderNumber) ||
        orderNumber <= 0
      ) {
        return Response.json(
          {
            success: false,
            code: "INVALID_INPUT",
            message: "Informe um número de pedido válido.",
          },
          {
            status: 400,
            headers: getCorsHeaders(req),
          },
        );
      }

      if (action === "status") {
        const { data, error } = await ctx.supabaseAdmin.rpc(
          "get_loyalty_status_by_phone",
          {
            p_order_number: orderNumber,
            p_phone: normalizedPhone,
          },
        );

        if (error) {
          console.error("Erro ao consultar fidelidade:", error);

          return Response.json(
            {
              success: false,
              code: "STATUS_ERROR",
              message:
                "Não foi possível consultar seu cartão agora. Tente novamente.",
            },
            {
              status: 500,
              headers: getCorsHeaders(req),
            },
          );
        }

        return Response.json(data, {
          status: 200,
          headers: getCorsHeaders(req),
        });
      }

      const { data, error } = await ctx.supabaseAdmin.rpc(
        "validate_loyalty_order_by_phone",
        {
          p_order_number: orderNumber,
          p_phone: normalizedPhone,
        },
      );

      if (error) {
        console.error("Erro ao validar fidelidade:", error);

        return Response.json(
          {
            success: false,
            code: "VALIDATION_ERROR",
            message:
              "Não foi possível validar o pedido agora. Tente novamente.",
          },
          {
            status: 500,
            headers: getCorsHeaders(req),
          },
        );
      }

      return Response.json(data, {
        status: 200,
        headers: getCorsHeaders(req),
      });
    } catch (error) {
      console.error("Erro inesperado na validação:", error);

      return Response.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message: "Não foi possível processar a solicitação.",
        },
        {
          status: 400,
          headers: getCorsHeaders(req),
        },
      );
    }
  }),
};