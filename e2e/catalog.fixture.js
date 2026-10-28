import { test as base, expect } from "@playwright/test";

// Only local resources and explicitly simulated, read-only requests are allowed.
export const test = base.extend({
	catalogNetwork: [
		async ({ context, baseURL }, use) => {
			const origin = new URL(baseURL).origin;
			const unexpected = [];
			const headers = {
				"access-control-allow-origin": "*",
				"access-control-allow-headers": "*",
				"access-control-allow-methods": "GET,OPTIONS",
			};
			await context.route("**/*", async (route) => {
				const request = route.request();
				const url = new URL(request.url());
				if (url.origin === origin) return route.continue();
				if (
					request.method() === "GET" &&
					url.hostname === "fonts.googleapis.com"
				) {
					return route.fulfill({ contentType: "text/css", body: "" });
				}
				const simulated = [
					"https://example.invalid",
					"https://example.supabase.co",
				].includes(url.origin);
				if (simulated && url.pathname === "/rest/v1/pickup_locations") {
					if (request.method() === "OPTIONS")
						return route.fulfill({ status: 204, headers });
					if (request.method() === "GET")
						return route.fulfill({
							headers,
							json: [
								{
									id: "fixture-pickup",
									name: "Ponto simulado",
									address: "Rua de teste",
									number: "1",
									neighborhood: "Centro",
								},
							],
						});
				}
				// Never echo headers, query strings, credentials or request bodies.
				unexpected.push(`${request.method()} ${url.origin}${url.pathname}`);
				return route.abort("blockedbyclient");
			});
			await context.routeWebSocket(/.*/, (socket) => {
				const url = new URL(socket.url());
				if (url.host === new URL(baseURL).host) socket.connectToServer();
				else {
					unexpected.push("Unexpected WebSocket");
					socket.close();
				}
			});
			await use();
			expect(
				unexpected,
				"unexpected requests were blocked, never simulated as success",
			).toEqual([]);
		},
		{ auto: true },
	],
});
export { expect };
