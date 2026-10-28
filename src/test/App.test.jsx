import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

describe("Pé de Moça - produtos", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/cardapio/cookies");
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network request in product tests"); }));
  });

  afterEach(() => {
    try {
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  async function openCookieModal(user) {
    await act(async () => {
      render(<App />);
    });

    const productTitle = await screen.findByRole("heading", {
      name: "Cookie Kinder Bueno",
    });

    const productCard = productTitle.closest(".product-card");

    expect(productCard).toBeInTheDocument();

    const addButton = within(productCard).getByRole("button", {
      name: /adicionar ao pedido/i,
    });

    await user.click(addButton);

    return screen.findByRole("heading", {
      name: "Cookie Kinder Bueno",
      level: 2,
    });
  }

  it("abre o modal do produto ao clicar em Adicionar ao pedido", async () => {
    const user = userEvent.setup();

    const modalTitle = await openCookieModal(user);

    expect(modalTitle).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Fechar",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Alguma observação sobre este produto?"),
    ).toBeInTheDocument();
  });

  it("permite alterar a quantidade e preencher uma observação", async () => {
    const user = userEvent.setup();

    await openCookieModal(user);

    const observation = screen.getByPlaceholderText(
      "Alguma observação sobre este produto?",
    );

    await user.type(observation, "Sem açúcar adicional");

    expect(observation).toHaveValue("Sem açúcar adicional");

    const increaseButton = screen.getByRole("button", {
      name: "+",
    });

    await user.click(increaseButton);

    const quantityControls = increaseButton.closest(".complement-quantity");

    expect(quantityControls).toBeInTheDocument();
    expect(within(quantityControls).getByText("2")).toBeInTheDocument();
  });

  it("limita a observação a 150 caracteres", async () => {
    const user = userEvent.setup();

    await openCookieModal(user);

    const observation = screen.getByPlaceholderText(
      "Alguma observação sobre este produto?",
    );

    const longText = "a".repeat(160);

    await user.type(observation, longText);

    expect(observation).toHaveValue("a".repeat(150));
    expect(screen.getByText("150/150")).toBeInTheDocument();
  });

  it("adiciona o produto ao carrinho preservando quantidade e observação", async () => {
    const user = userEvent.setup();

    await openCookieModal(user);

    const observation = screen.getByPlaceholderText(
      "Alguma observação sobre este produto?",
    );

    await user.type(observation, "Sem açúcar adicional");

    const increaseButton = screen.getByRole("button", {
      name: "+",
    });

    await user.click(increaseButton);

    const confirmButton = screen.getByRole("button", {
      name: "Adicionar ao pedido",
    });

    await user.click(confirmButton);

    const savedCart = JSON.parse(localStorage.getItem("pedemoca-cart"));

    expect(savedCart).toHaveLength(1);
    expect(savedCart[0].name).toBe("Cookie Kinder Bueno");
    expect(savedCart[0].quantity).toBe(2);
    expect(savedCart[0].observation).toBe("Sem açúcar adicional");
  });
});
