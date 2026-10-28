import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import CheckoutModal from "../components/CheckoutModal";

const backend = vi.hoisted(() => ({ freight: vi.fn(), invoke: vi.fn() }));
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: (table) => {
      const query = {
        select: () => query,
        eq: () => query,
        order: async () => ({ data: [{ id: "point", name: "Vila Nova", address: "Rua A", number: "1" }] }),
        maybeSingle: () => backend.freight(table),
      };
      return query;
    },
    functions: { invoke: backend.invoke },
  },
}));

let callbacks;
let nextFrame;
let now;
let media;
let mediaListener;
let boundsSpy;
const normalized = vi.fn();

beforeEach(() => {
  backend.freight.mockReset();
  backend.invoke.mockReset();
  normalized.mockReset();
  callbacks = new Map();
  nextFrame = 0;
  now = 0;
  media = { matches: false, addEventListener: vi.fn((_, fn) => { mediaListener = fn; }), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  vi.stubGlobal("requestAnimationFrame", vi.fn((fn) => { callbacks.set(++nextFrame, fn); return nextFrame; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id) => callbacks.delete(id)));
  boundsSpy = vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 390, height: 600 });
  HTMLDialogElement.prototype.showModal = vi.fn(function () { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn(function () { this.removeAttribute("open"); });
});
afterEach(() => { boundsSpy.mockRestore(); vi.unstubAllGlobals(); });

function Harness({ valid = false }) {
  const [open, setOpen] = useState(true);
  const [customer, setCustomer] = useState({ name: valid ? " Ana Silva " : "", whatsapp: valid ? "11912345678" : "" });
  return <>
    <button type="button" onClick={() => setOpen(true)}>Reabrir</button>
    <CheckoutModal open={open} onClose={() => setOpen(false)} customer={customer}
      onCustomerChange={(value) => { normalized(value); setCustomer(value); }}
      subtotal={20} cart={[]} onOrderSuccess={vi.fn()} />
  </>;
}
function tick(delta) {
  act(() => {
    now += delta;
    const pending = [...callbacks.values()];
    callbacks.clear();
    for (const callback of pending) callback(now);
  });
}
function finishTurn() {
  tick(0); tick(100); tick(600); tick(0); tick(100);
}
function click(name) { fireEvent.click(screen.getByRole("button", { name })); }
function begin() {
  const form = screen.getByLabelText("Nome").closest("form");
  fireEvent.click(within(form).getByRole("button", { name: "Continuar\u2192", exact: true }));
}
function goToAddress() {
  begin(); finishTurn();
  click(/Entrega/);
  click(/Continuar/); finishTurn();
  fireEvent.change(screen.getByLabelText("Bairro"), { target: { value: "Centro" } });
  fireEvent.change(screen.getByLabelText("Rua / Avenida"), { target: { value: "Rua A" } });
  fireEvent.change(screen.getByLabelText("Número"), { target: { value: "10" } });
}
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

it("preserves validation, typing focus and normalization", () => {
  render(<Harness />);
  begin();
  expect(screen.getByText("Informe seu nome.")).toBeInTheDocument();
  expect(screen.getByLabelText("Nome")).toHaveFocus();
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: " Ana Silva " } });
  fireEvent.change(screen.getByLabelText("WhatsApp"), { target: { value: "11912345678" } });
  begin();
  expect(normalized).toHaveBeenLastCalledWith({ name: "Ana Silva", whatsapp: "(11) 91234-5678" });
  finishTurn();
  expect(screen.getByRole("heading", { name: "Como você quer receber?" })).toHaveFocus();
});

it("rejects repeated submit synchronously and commits only after the curl", () => {
  render(<Harness valid />);
  const form = screen.getByLabelText("Nome").closest("form");
  fireEvent.submit(form); fireEvent.submit(form);
  expect(normalized).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
  tick(0); tick(100); tick(300);
  expect(screen.getByRole("heading", { name: "Seus dados" })).toBeInTheDocument();
  expect(document.querySelectorAll("#checkout-name")).toHaveLength(1);
  tick(300); tick(0); tick(100);
  expect(screen.getByRole("heading", { name: "Como você quer receber?" })).toHaveFocus();
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "false");
  expect(backend.invoke).not.toHaveBeenCalled();
});

it("uses the same surface backwards, preserves values and never measures in the tick", () => {
  render(<Harness valid />);
  begin();
  const measurements = boundsSpy.mock.calls.length;
  tick(0); tick(100); tick(300);
  const forward = document.querySelector('[data-curl-part="front"]').getAttribute("d");
  tick(300); tick(0); tick(100);
  click(/Voltar/);
  tick(0); tick(100); tick(300);
  const backward = document.querySelector('[data-curl-part="front"]').getAttribute("d");
  expect(backward).toBe(forward);
  tick(300); tick(0); tick(100);
  expect(screen.getByLabelText("Nome")).toHaveValue("Ana Silva");
  expect(screen.getByLabelText("WhatsApp")).toHaveValue("(11) 91234-5678");
  expect(screen.getByRole("heading", { name: "Seus dados" })).toHaveFocus();
  expect(boundsSpy).toHaveBeenCalledTimes(measurements);
});

it("cancels when closed and does not navigate after reopening", () => {
  render(<Harness valid />);
  begin(); tick(0); tick(100);
  click("Fechar checkout");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  tick(1000);
  click("Reabrir");
  expect(screen.getByRole("heading", { name: "Seus dados" })).toBeInTheDocument();
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "false");
});

it("cancels the animation on unmount", () => {
  const view = render(<Harness valid />);
  begin(); tick(0);
  view.unmount();
  expect(callbacks.size).toBe(0);
  tick(2000);
  expect(backend.invoke).not.toHaveBeenCalled();
});

it("navigates immediately with reduced motion and finishes once when preference changes", () => {
  media.matches = true;
  render(<Harness valid />);
  begin();
  expect(screen.getByRole("heading", { name: "Como você quer receber?" })).toHaveFocus();
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "false");
  media.matches = false;
  click(/Voltar/); tick(0); tick(100);
  act(() => { media.matches = true; mediaListener(); });
  expect(screen.getByRole("heading", { name: "Seus dados" })).toHaveFocus();
  tick(1000);
  expect(screen.getByRole("heading", { name: "Seus dados" })).toHaveFocus();
});

it("falls back to static navigation without usable measurements", () => {
  boundsSpy.mockReturnValue({ width: 0, height: 0 });
  render(<Harness valid />);
  begin();
  expect(screen.getByRole("heading", { name: "Como você quer receber?" })).toHaveFocus();
});

it("does not bypass delivery selection validation", () => {
  render(<Harness valid />);
  begin(); finishTurn();
  click(/Continuar/);
  expect(screen.getByText("Escolha uma opção para continuar.")).toBeInTheDocument();
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "false");
});

it("ignores freight success after back navigation", async () => {
  const request = deferred(); backend.freight.mockReturnValue(request.promise);
  render(<Harness valid />); goToAddress();
  click(/Calcular entrega/);
  click(/Voltar/); finishTurn();
  await act(async () => { request.resolve({ data: { id: "old", delivery_fee: 99 } }); await request.promise; });
  expect(screen.getByRole("heading", { name: "Como você quer receber?" })).toBeInTheDocument();
  expect(screen.queryByText("Resumo do pedido")).not.toBeInTheDocument();
});

it("ignores old freight errors and finally while a new address request is pending", async () => {
  const old = deferred(); const current = deferred();
  backend.freight.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
  render(<Harness valid />); goToAddress();
  click(/Calcular entrega/);
  fireEvent.change(screen.getByLabelText("Rua / Avenida"), { target: { value: "Rua B" } });
  click(/Calcular entrega/);
  await act(async () => { old.reject(new Error("old")); await old.promise.catch(() => {}); });
  expect(screen.getByRole("button", { name: /Calculando/ })).toBeDisabled();
  expect(screen.queryByText(/Não foi possível calcular/)).not.toBeInTheDocument();
  await act(async () => { current.resolve({ data: { id: "new", delivery_fee: 5 } }); await current.promise; });
  finishTurn();
  expect(screen.getByRole("heading", { name: "Resumo do pedido" })).toHaveFocus();
});

it("ignores freight from a previous checkout session", async () => {
  const old = deferred(); backend.freight.mockReturnValue(old.promise);
  render(<Harness valid />); goToAddress(); click(/Calcular entrega/);
  click("Fechar checkout"); click("Reabrir");
  await act(async () => { old.resolve({ data: { id: "old", delivery_fee: 99 } }); await old.promise; });
  expect(screen.getByRole("heading", { name: "Seus dados" })).toBeInTheDocument();
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "false");
});

it("preserves cash validation and requires explicit order confirmation", async () => {
  backend.freight.mockResolvedValue({ data: { id: "center", delivery_fee: 5 } });
  render(<Harness valid />); goToAddress();
  await act(async () => { click(/Calcular entrega/); });
  finishTurn(); click(/Continuar/); finishTurn();
  click(/Continuar/);
  expect(screen.getByText("Escolha uma forma de pagamento.")).toBeInTheDocument();
  click(/Dinheiro/); click(/Continuar/);
  expect(screen.getByText("Informe se você precisa de troco.")).toBeInTheDocument();
  click("Não"); click(/Continuar/); finishTurn();
  expect(screen.getByRole("heading", { name: "Revise seu pedido" })).toHaveFocus();
  expect(screen.getByRole("button", { name: /Confirmar pedido/ })).toBeEnabled();
  expect(backend.invoke).not.toHaveBeenCalled();
});

it("ignores an old freight success when the address changes", async () => {
  const old = deferred(); backend.freight.mockReturnValue(old.promise);
  render(<Harness valid />); goToAddress(); click(/Calcular entrega/);
  fireEvent.change(screen.getByLabelText("Número"), { target: { value: "20" } });
  await act(async () => { old.resolve({ data: { id: "old", delivery_fee: 99 } }); await old.promise; });
  expect(screen.getByRole("heading", { name: "Endereço de entrega" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Calcular entrega/ })).toBeEnabled();
});

it("restores content and focus if the viewport changes during the fold", () => {
  render(<Harness valid />); begin(); tick(0); tick(100);
  boundsSpy.mockReturnValue({ width: 390, height: 350 });
  fireEvent(window, new Event("resize"));
  expect(screen.getByRole("heading", { name: "Como você quer receber?" })).toHaveFocus();
  expect(document.querySelector(".checkout-page").style.opacity).toBe("");
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "false");
});

it("keeps observers and the active curl stable across a parent rerender", () => {
  const view = render(<Harness valid />);
  begin(); tick(0); tick(100);
  const subscriptions = media.addEventListener.mock.calls.length;
  view.rerender(<Harness valid />);
  expect(media.addEventListener).toHaveBeenCalledTimes(subscriptions);
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
  tick(600); tick(0); tick(100);
  expect(screen.getByRole("heading", { name: "Como voc\u00ea quer receber?" })).toHaveFocus();
});

it("cancels when the owner closes the dialog through the open prop", () => {
  const props = { customer: { name: "Ana", whatsapp: "11912345678" },
    onClose: vi.fn(), onCustomerChange: vi.fn(), subtotal: 20, cart: [] };
  const view = render(<CheckoutModal {...props} open />);
  begin(); tick(0); tick(100);
  view.rerender(<CheckoutModal {...props} open={false} />);
  tick(1000);
  view.rerender(<CheckoutModal {...props} open />);
  expect(screen.getByRole("heading", { name: "Seus dados" })).toBeInTheDocument();
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "false");
});

it("holds the synchronous confirmation lock until the mocked request settles", async () => {
  backend.freight.mockResolvedValue({ data: { id: "center", delivery_fee: 5 } });
  const request = deferred(); backend.invoke.mockReturnValue(request.promise);
  render(<Harness valid />); goToAddress();
  await act(async () => { click(/Calcular entrega/); });
  finishTurn(); click(/Continuar/); finishTurn();
  click(/Dinheiro/); click("N\u00e3o"); click(/Continuar/); finishTurn();
  const confirm = screen.getByRole("button", { name: /Confirmar pedido/ });
  act(() => { confirm.click(); confirm.click(); });
  expect(backend.invoke).toHaveBeenCalledTimes(1);
  await act(async () => { request.resolve({ data: { id: "fixture", order_number: 24 } }); await request.promise; });
});
