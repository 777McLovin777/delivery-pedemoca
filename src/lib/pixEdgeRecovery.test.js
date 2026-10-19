import { afterEach, describe, expect, it, vi } from "vitest";
import pixFunction from "../../supabase/functions/criar-pix/index.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Edge Function PIX - recuperação segura", () => {
  const orderId = "123e4567-e89b-42d3-a456-426614174000";
  const checkoutToken = "123e4567-e89b-42d3-b456-426614174001";
  const attemptId = "123e4567-e89b-42d3-a456-426614174002";
  const idempotencyKey = "123e4567-e89b-42d3-b456-426614174003";
  const providerOrderId = "mp-order-123";

  function makeOrder() {
    return {
      id: orderId,
      order_number: 1001,
      total: 24.9,
      status: "pending",
      payment_method: "pix",
      payment_status: "pending",
      payment_reference: null,
    };
  }

  function makeAttempt(overrides = {}) {
    return {
      attempt_id: attemptId,
      idempotency_key: idempotencyKey,
      attempt_status: "processing",
      provider_order_id: null,
      payer_email: "cliente@example.com",
      request_payload: { type: "online" },
      ...overrides,
    };
  }

  function makeSupabaseAdmin(attempt) {
    return {
      from(table) {
        const query = {
          select: () => query,
          eq: () => query,
          maybeSingle: async () => ({
            data: table === "orders"
              ? makeOrder()
              : { created_at: "2026-10-15T10:00:00.000Z" },
            error: null,
          }),
        };
        return query;
      },
      rpc: vi.fn(async (name) => {
        if (name === "reserve_pix_payment_attempt") {
          return { data: [attempt], error: null };
        }

        if (name === "save_pix_payment_response") {
          return { data: true, error: null };
        }

        throw new Error(`RPC inesperada: ${name}`);
      }),
    };
  }

  function makeRequest() {
    return new Request(
      "http://localhost/functions/v1/criar-pix",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          checkoutToken,
          payerEmail: "cliente@example.com",
        }),
      },
    );
  }

  function mockDenoAndFetch(fetchMock) {
    vi.stubGlobal("Deno", {
      env: { get: () => "token-de-teste" },
    });
    vi.stubGlobal("fetch", fetchMock);
  }

  it("não envia novo POST quando a consulta de recuperação falha", async () => {
    const attempt = makeAttempt();
    const supabaseAdmin = makeSupabaseAdmin(attempt);

    const fetchMock = vi.fn(async () => {
      throw new Error("Falha simulada na consulta ao Mercado Pago");
    });

    mockDenoAndFetch(fetchMock);

    const response = await pixFunction.fetch(
      makeRequest(),
      { supabaseAdmin },
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.readyForPix).toBe(false);
    expect(body.attemptStatus).toBe("processing");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.method ?? "GET").toBe("GET");

    expect(
      supabaseAdmin.rpc.mock.calls.some(
        ([name]) => name === "save_pix_payment_response",
      ),
    ).toBe(false);
  });

  it("recupera uma cobrança existente por GET sem enviar novo POST", async () => {
    const attempt = makeAttempt({
      provider_order_id: providerOrderId,
    });
    const supabaseAdmin = makeSupabaseAdmin(attempt);

    const fetchMock = vi.fn(async (url, options = {}) => {
      expect(String(url)).toContain(providerOrderId);
      expect(options.method ?? "GET").toBe("GET");

      return Response.json({
        id: providerOrderId,
        external_reference: orderId,
        status: "action_required",
        status_detail: "waiting_transfer",
        transactions: {
          payments: [
            {
              amount: 24.9,
              status: "action_required",
              status_detail: "waiting_transfer",
              payment_method: {
                id: "pix",
                qr_code: "PIX-COPIA-E-COLA-TESTE",
                qr_code_base64: "BASE64-TESTE",
              },
            },
          ],
        },
      });
    });

    mockDenoAndFetch(fetchMock);

    const response = await pixFunction.fetch(
      makeRequest(),
      { supabaseAdmin },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.readyForPix).toBe(true);
    expect(body.pixCode).toBe("PIX-COPIA-E-COLA-TESTE");
    expect(body.qrCodeBase64).toBe("BASE64-TESTE");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.method ?? "GET").toBe("GET");

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
      "save_pix_payment_response",
      {
        p_attempt_id: attemptId,
        p_idempotency_key: idempotencyKey,
        p_provider_order_id: providerOrderId,
        p_pix_code: "PIX-COPIA-E-COLA-TESTE",
        p_qr_code_base64: "BASE64-TESTE",
      },
    );
  });
});


it("recupera cobrança encontrada na pesquisa sem criar outra", async () => {
  const orderId = "123e4567-e89b-42d3-a456-426614174000";
  const checkoutToken = "123e4567-e89b-42d3-b456-426614174001";
  const attemptId = "123e4567-e89b-42d3-a456-426614174002";
  const idempotencyKey = "123e4567-e89b-42d3-b456-426614174003";
  const providerOrderId = "mp-order-456";

  const attempt = {
    attempt_id: attemptId,
    idempotency_key: idempotencyKey,
    attempt_status: "processing",
    provider_order_id: null,
    payer_email: "cliente@example.com",
    request_payload: { type: "online" },
  };

  const supabaseAdmin = {
    from(table) {
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({
          data: table === "orders"
            ? {
                id: orderId,
                order_number: 1001,
                total: 24.9,
                status: "pending",
                payment_method: "pix",
                payment_status: "pending",
                payment_reference: null,
              }
            : { created_at: "2026-10-15T10:00:00.000Z" },
          error: null,
        }),
      };
      return query;
    },
    rpc: vi.fn(async (name) => {
      if (name === "reserve_pix_payment_attempt") {
        return { data: [attempt], error: null };
      }
      if (name === "save_pix_payment_response") {
        return { data: true, error: null };
      }
      throw new Error(`RPC inesperada: ${name}`);
    }),
  };

  const fetchMock = vi.fn(async (url, options = {}) => {
    expect(options.method ?? "GET").toBe("GET");

    if (String(url).includes("/v1/orders?")) {
      return Response.json({
        data: [{ id: providerOrderId, external_reference: orderId }],
        paging: { total: 1, limit: 100, offset: 0 },
      });
    }

    expect(String(url)).toContain(providerOrderId);

    return Response.json({
      id: providerOrderId,
      external_reference: orderId,
      status: "action_required",
      status_detail: "waiting_transfer",
      transactions: {
        payments: [{
          amount: 24.9,
          status: "action_required",
          status_detail: "waiting_transfer",
          payment_method: {
            id: "pix",
            qr_code: "PIX-RECUPERADO",
            qr_code_base64: "BASE64-RECUPERADO",
          },
        }],
      },
    });
  });

  vi.stubGlobal("Deno", {
    env: { get: () => "token-de-teste" },
  });
  vi.stubGlobal("fetch", fetchMock);

  const response = await pixFunction.fetch(
    new Request("http://localhost/functions/v1/criar-pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        checkoutToken,
        payerEmail: "cliente@example.com",
      }),
    }),
    { supabaseAdmin },
  );

  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.readyForPix).toBe(true);
  expect(body.pixCode).toBe("PIX-RECUPERADO");
  expect(fetchMock).toHaveBeenCalledTimes(2);

  expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
    "save_pix_payment_response",
    {
      p_attempt_id: attemptId,
      p_idempotency_key: idempotencyKey,
      p_provider_order_id: providerOrderId,
      p_pix_code: "PIX-RECUPERADO",
      p_qr_code_base64: "BASE64-RECUPERADO",
    },
  );
});

it("bloqueia recuperação quando a pesquisa encontra duas cobranças", async () => {
  const orderId = "123e4567-e89b-42d3-a456-426614174000";
  const attemptId = "123e4567-e89b-42d3-a456-426614174002";
  const idempotencyKey = "123e4567-e89b-42d3-b456-426614174003";

  const attempt = {
    attempt_id: attemptId,
    idempotency_key: idempotencyKey,
    attempt_status: "processing",
    provider_order_id: null,
    payer_email: "cliente@example.com",
    request_payload: { type: "online" },
  };

  const supabaseAdmin = {
    from(table) {
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({
          data: table === "orders"
            ? {
                id: orderId,
                order_number: 1001,
                total: 24.9,
                status: "pending",
                payment_method: "pix",
                payment_status: "pending",
                payment_reference: null,
              }
            : { created_at: "2026-10-15T10:00:00.000Z" },
          error: null,
        }),
      };
      return query;
    },
    rpc: vi.fn(async (name) => {
      if (name === "reserve_pix_payment_attempt") {
        return { data: [attempt], error: null };
      }
      throw new Error(`RPC inesperada: ${name}`);
    }),
  };

  const fetchMock = vi.fn(async (_url, options = {}) => {
    expect(options.method ?? "GET").toBe("GET");

    return Response.json({
      data: [
        { id: "mp-order-111", external_reference: orderId },
        { id: "mp-order-222", external_reference: orderId },
      ],
      paging: {
        total: 2,
        limit: 100,
        offset: 0,
      },
    });
  });

  vi.stubGlobal("Deno", {
    env: { get: () => "token-de-teste" },
  });
  vi.stubGlobal("fetch", fetchMock);

  const response = await pixFunction.fetch(
    new Request("http://localhost/functions/v1/criar-pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        checkoutToken: "123e4567-e89b-42d3-b456-426614174001",
        payerEmail: "cliente@example.com",
      }),
    }),
    { supabaseAdmin },
  );

  const body = await response.json();

  expect(response.status).toBe(202);
  expect(body.readyForPix).toBe(false);
  expect(body.attemptStatus).toBe("processing");

  expect(fetchMock).toHaveBeenCalledTimes(1);

  expect(
    supabaseAdmin.rpc.mock.calls.some(
      ([name]) => name === "save_pix_payment_response",
    ),
  ).toBe(false);
});

it("não libera PIX quando o salvamento falha e o banco não confirma", async () => {
  const orderId = "123e4567-e89b-42d3-a456-426614174000";
  const providerOrderId = "mp-order-789";
  const attemptId = "123e4567-e89b-42d3-a456-426614174002";
  const idempotencyKey = "123e4567-e89b-42d3-b456-426614174003";

  const attempt = {
    attempt_id: attemptId,
    idempotency_key: idempotencyKey,
    attempt_status: "processing",
    provider_order_id: providerOrderId,
    payer_email: "cliente@example.com",
    request_payload: { type: "online" },
  };

  const reads = [];

  const supabaseAdmin = {
    from(table) {
      reads.push(table);
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({
          data: table === "orders"
            ? {
                id: orderId,
                order_number: 1001,
                total: 24.9,
                status: "pending",
                payment_method: "pix",
                payment_status: "pending",
                payment_reference: null,
              }
            : {
                status: "processing",
                provider_order_id: providerOrderId,
                pix_code: null,
                qr_code_base64: null,
              },
          error: null,
        }),
      };
      return query;
    },
    rpc: vi.fn(async (name) => {
      if (name === "reserve_pix_payment_attempt") {
        return { data: [attempt], error: null };
      }
      if (name === "save_pix_payment_response") {
        return {
          data: null,
          error: { message: "Falha simulada no salvamento" },
        };
      }
      throw new Error(`RPC inesperada: ${name}`);
    }),
  };

  const fetchMock = vi.fn(async (_url, options = {}) => {
    expect(options.method ?? "GET").toBe("GET");

    return Response.json({
      id: providerOrderId,
      external_reference: orderId,
      status: "action_required",
      status_detail: "waiting_transfer",
      transactions: {
        payments: [{
          amount: 24.9,
          status: "action_required",
          status_detail: "waiting_transfer",
          payment_method: {
            id: "pix",
            qr_code: "PIX-NAO-CONFIRMADO",
            qr_code_base64: "BASE64-TESTE",
          },
        }],
      },
    });
  });

  vi.stubGlobal("Deno", {
    env: { get: () => "token-de-teste" },
  });
  vi.stubGlobal("fetch", fetchMock);

  const response = await pixFunction.fetch(
    new Request("http://localhost/functions/v1/criar-pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        checkoutToken: "123e4567-e89b-42d3-b456-426614174001",
        payerEmail: "cliente@example.com",
      }),
    }),
    { supabaseAdmin },
  );

  const body = await response.json();

  expect(response.status).toBe(202);
  expect(body.readyForPix).toBe(false);
  expect(body.attemptStatus).toBe("processing");
  expect(body.pixCode).toBeUndefined();

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(reads.filter((table) => table === "orders")).toHaveLength(2);
  expect(reads).toContain("pix_payment_attempts");

  expect(
    supabaseAdmin.rpc.mock.calls.some(
      ([name]) => name === "save_pix_payment_response",
    ),
  ).toBe(true);
});
