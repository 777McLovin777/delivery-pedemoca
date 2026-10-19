import { describe, expect, it } from "vitest";
import pixFunction from "../../supabase/functions/criar-pix/index.ts";

describe("Edge Function PIX", () => {
  it("carrega o handler sem iniciar serviços externos", () => {
    expect(typeof pixFunction.fetch).toBe("function");
  });
});
