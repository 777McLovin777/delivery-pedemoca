import { test as base, expect } from "@playwright/test";

// Every browser request is either local, explicitly simulated, or blocked.
// No credentials are inherited and no order request reaches a server.
export const test = base.extend({
  network: [async ({ context }, use) => {
    const unexpected = [];
    const orders = [];
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === "http://127.0.0.1:4173") return route.continue();
      if (url.hostname === "fonts.googleapis.com") {
        return route.fulfill({ contentType: "text/css", body: "" });
      }
      if (url.origin === "https://supabase.invalid") {
        const headers = { "access-control-allow-origin": "*",
          "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,OPTIONS" };
        if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
        if (request.method() === "GET" && url.pathname === "/rest/v1/pickup_locations") {
          return route.fulfill({ headers, json: [{ id: "point", name: "Vila Nova", address: "Rua A", number: "1", neighborhood: "Centro" }] });
        }
        if (request.method() === "GET" && url.pathname === "/rest/v1/delivery_neighborhoods") {
          return route.fulfill({ headers, json: { id: "center", name: "Centro", delivery_fee: 5 } });
        }
        if (request.method() === "POST" && url.pathname === "/functions/v1/criar-pedido") {
          orders.push(request.postDataJSON());
          return route.fulfill({ headers, json: { id: "00000000-0000-4000-8000-000000000001", order_number: 24, total: 25 } });
        }
      }
      // Do not include URL query strings, headers, payloads or credentials in failures.
      unexpected.push(`${request.method()} ${url.origin}${url.pathname}`);
      return route.abort("blockedbyclient");
    });
    await context.routeWebSocket(/.*/, (socket) => {
      const url = new URL(socket.url());
      if (url.origin === "ws://127.0.0.1:4173") socket.connectToServer();
      else { unexpected.push("Unexpected WebSocket"); socket.close(); }
    });
    await use({ orders });
    expect(unexpected, "all external requests must be explicitly simulated").toEqual([]);
  }, { auto: true }],
});
export { expect };
