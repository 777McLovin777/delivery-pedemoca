import { describe, expect, it } from "vitest";
import {
  selectUniquePixOrder,
  selectPixOrderFromSearch,
} from "../../supabase/functions/criar-pix/pixRecovery.ts";

describe("Recuperação PIX no backend", () => {
  it("bloqueia múltiplas cobranças do mesmo pedido", () => {
    const orders = [
      { id: "123", external_reference: "pedido-1" },
      { id: "456", external_reference: "pedido-1" },
    ];

    expect(() => selectUniquePixOrder(orders, "pedido-1")).toThrow(
      "Resultado ambíguo na recuperação PIX.",
    );
  });

  it("não considera uma pesquisa vazia como cobrança recuperada", () => {
    expect(selectUniquePixOrder([], "pedido-1")).toBeNull();
  });

  it("rejeita uma cobrança de outro pedido", () => {
    expect(() =>
      selectUniquePixOrder(
        [{ id: "123", external_reference: "pedido-2" }],
        "pedido-1",
      ),
    ).toThrow("Cobrança não corresponde ao pedido.");
  });

  it("aceita uma cobrança única com referência correspondente", () => {
    const order = {
      id: "123",
      external_reference: "pedido-1",
    };

    expect(selectUniquePixOrder([order], "pedido-1")).toEqual(order);
  });

  it("bloqueia uma pesquisa quando existem páginas não verificadas", () => {
    const searchResponse = {
      data: [
        {
          id: "123",
          external_reference: "pedido-1",
        },
      ],
      paging: {
        total: 2,
        limit: 1,
        offset: 0,
      },
    };

    expect(() => selectPixOrderFromSearch(searchResponse, "pedido-1")).toThrow(
      "Pesquisa PIX incompleta.",
    );
  });

  it("rejeita uma pesquisa sem informações de paginação", () => {
    const searchResponse = {
      data: [
        {
          id: "123",
          external_reference: "pedido-1",
        },
      ],
    };

    expect(() => selectPixOrderFromSearch(searchResponse, "pedido-1")).toThrow(
      "Paginação inválida na pesquisa PIX.",
    );
  });

  it("bloqueia uma pesquisa com total maior que os resultados recebidos", () => {
    const searchResponse = {
      data: [],
      paging: {
        total: 1,
        limit: 10,
        offset: 0,
      },
    };

    expect(() => selectPixOrderFromSearch(searchResponse, "pedido-1")).toThrow(
      "Pesquisa PIX incompleta.",
    );
  });

  it("rejeita cobrança de outro pedido mesmo com paginação completa", () => {
    const searchResponse = {
      data: [
        {
          id: "123",
          external_reference: "pedido-errado",
        },
      ],
      paging: {
        total: 1,
        limit: 10,
        offset: 0,
      },
    };

    expect(() => selectPixOrderFromSearch(searchResponse, "pedido-1")).toThrow(
      "Cobrança não corresponde ao pedido.",
    );
  });

  it("bloqueia formato de paginação não reconhecido", () => {
    const searchResponse = {
      data: [{ id: "123", external_reference: "pedido-1" }],
      paging: {
        total: 1,
        page: 1,
        page_size: 20,
      },
    };

    expect(() => selectPixOrderFromSearch(searchResponse, "pedido-1")).toThrow(
      "Paginação inválida na pesquisa PIX.",
    );
  });

  it("aceita pesquisa completa com uma cobrança válida", () => {
    const searchResponse = {
      data: [
        {
          id: "123",
          external_reference: "pedido-1",
        },
      ],
      paging: {
        total: 1,
        limit: 10,
        offset: 0,
      },
    };

    expect(selectPixOrderFromSearch(searchResponse, "pedido-1")).toEqual({
      id: "123",
      external_reference: "pedido-1",
    });
  });

  it("aceita paginação numérica representada como texto", () => {
    const searchResponse = {
      data: [
        {
          id: "123",
          external_reference: "pedido-1",
        },
      ],
      paging: {
        total: "1",
        limit: "10",
        offset: "0",
      },
    };

    expect(selectPixOrderFromSearch(searchResponse, "pedido-1")).toEqual({
      id: "123",
      external_reference: "pedido-1",
    });
  });
});
