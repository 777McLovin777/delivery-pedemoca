import { describe, expect, it } from "vitest";
import { checkoutPageCurlGeometry as shape } from "./checkoutPageCurlGeometry";

describe("Page Curl geometry", () => {
  it("has exact flat and fully withdrawn endpoints without a residual strip", () => {
    const flat = shape(0, 520, 650);
    const folded = shape(1, 520, 650);
    expect(flat.front).toContain("650");
    expect(flat.fold).toBe(650);
    expect(folded.front).toBe("");
    expect(folded.fold).toBe(0);
    for (const end of [flat, folded]) {
      expect(end.flap).toBe("");
      expect(end.shadowOpacity).toBe(0);
      expect(end.bulge).toBe(0);
    }
  });

  it("approaches both endpoints smoothly and clamps out-of-range progress", () => {
    for (const p of [.000001, .999999]) {
      const result = shape(p, 520, 650);
      expect(result.bulge).toBeLessThan(1e-9);
      expect(result.shadowOpacity).toBeLessThan(1e-9);
      expect(result.flapOpacity).toBeLessThan(1e-9);
    }
    expect(shape(-1, 520, 650)).toEqual(shape(0, 520, 650));
    expect(shape(2, 520, 650)).toEqual(shape(1, 520, 650));
  });

  it("returns the identical surface when traversed in reverse", () => {
    const forward = Array.from({ length: 101 }, (_, i) => shape(i / 100, 390, 600));
    const backward = Array.from({ length: 101 }, (_, i) => shape((100 - i) / 100, 390, 600));
    expect(backward.reverse()).toEqual(forward);
  });

  it("keeps responsive paths finite and produces a belly and soft shadow", () => {
    for (const [width, height] of [[280, 300], [580, 718]]) {
      for (let i = 0; i <= 100; i++) {
        expect(JSON.stringify(shape(i / 100, width, height))).not.toMatch(/NaN|Infinity/);
      }
      const middle = shape(.5, width, height);
      expect(middle.bulge).toBe(1);
      expect(middle.shadowOpacity).toBeCloseTo(.22);
      expect(middle.front).toContain("C");
      expect(middle.flap).not.toBe("");
    }
  });
});
