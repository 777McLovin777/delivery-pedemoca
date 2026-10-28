import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vitest";

afterEach(() => {
  cleanup();
});

let unexpectedRequests = [];
beforeEach(() => {
  unexpectedRequests = [];
  vi.stubGlobal("fetch", vi.fn(async () => {
    unexpectedRequests.push("unexpected network request");
    throw new Error("Network disabled in unit tests; use an explicit mock");
  }));
});
afterEach(() => {
  expect(unexpectedRequests).toEqual([]);
});
