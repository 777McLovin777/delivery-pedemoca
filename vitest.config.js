import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const mockPath = (file) =>
  fileURLToPath(new URL(`./src/test/mocks/${file}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@supabase/server": mockPath("supabase-server.js"),
      "@supabase/functions-js/edge-runtime.d.ts": mockPath("edge-runtime.js"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
  },
});
