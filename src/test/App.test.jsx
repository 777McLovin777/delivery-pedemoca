import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import App from "../App";

describe("Pé de Moça - produtos", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("abre o modal do produto ao clicar em Adicionar ao pedido", async () => {
    const user = userEvent.setup();

    render(<App />);

    const productTitle = screen.getByRole("heading", {
      name: "Mousse de Café",
    });

    const productCard = productTitle.closest(".product-card");

    expect(productCard).toBeInTheDocument();

    const addButton = within(productCard).getByRole("button", {
      name: /adicionar ao pedido/i,
    });

    await user.click(addButton);

    expect(
      screen.getByRole("heading", {
        name: "Mousse de Café",
        level: 2,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Fechar",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Alguma observação sobre este produto?"),
    ).toBeInTheDocument();
  });
});
