import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import CheckoutModal from "../components/CheckoutModal";

const { invokeMock } = vi.hoisted(() => ({
        invokeMock: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
        supabase: {
                from: () => ({
                        select: () => ({
                                eq: () => ({
                                        order: async () => ({
                                                data: [{
                                                        id: 1,
                                                        name: "Morro Branco",
                                                        address: "Rua Teste",
                                                        number: "100",
                                                        number: "100",
                                                        neighborhood: "Morro Branco",
                                                }],
                                                error: null,
                                        }),
                                }),
                        }),
                }),
                functions: {
                        invoke: invokeMock,
                },
        },
}));


beforeEach(() => {
        localStorage.clear();
        invokeMock.mockReset();
	HTMLDialogElement.prototype.showModal = vi.fn(function () {
		this.setAttribute("open", "");
	});
	HTMLDialogElement.prototype.close = vi.fn();
});
function Harness() {
    const [customer, setCustomer] = useState({ name: "", whatsapp: "" });
    const [open, setOpen] = useState(true);

    return (
        <>
            <button type="button" onClick={() => setOpen(true)}>
                Abrir checkout
            </button>
            <CheckoutModal
                open={open}
                onClose={() => setOpen(false)}
                customer={customer}
                onCustomerChange={setCustomer}
                cart={[{ id: 101, quantity: 1 }]}
                subtotal={12.90}
            />
        </>
    );
}
it("valida campos vazios e mantém foco no primeiro erro", async () => {
	render(<Harness />);
	await userEvent.click(screen.getByRole("button", { name: /Continuar/ }));
	expect(screen.getByText("Informe seu nome.")).toBeInTheDocument();
	expect(screen.getByLabelText("Nome")).toHaveFocus();
	expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
it("aceita celular formatado, normaliza dados e mantém foco durante digitação", async () => {
	const user = userEvent.setup();
	render(<Harness />);
	await user.type(screen.getByLabelText("Nome"), " Ana Silva ");
	expect(screen.getByLabelText("Nome")).toHaveFocus();
	await user.type(screen.getByLabelText("WhatsApp"), "(11) 91234-5678");
	await user.click(screen.getByRole("button", { name: /Continuar/ }));
	expect(screen.getByLabelText("Nome")).toHaveValue("Ana Silva");
	expect(screen.getByLabelText("WhatsApp")).toHaveValue("(11) 91234-5678");
	expect(screen.getByRole("dialog")).toHaveClass("checkout-step-exit-left");
	fireEvent.change(screen.getByLabelText("WhatsApp"), {
		target: { value: "123" },
	});
	await user.click(screen.getByRole("button", { name: /Continuar/ }));
	expect(screen.getByLabelText("WhatsApp")).toHaveAttribute(
		"aria-invalid",
		"true",
	);
	expect(screen.queryByRole("status")).not.toBeInTheDocument();
});




it("bloqueia uma segunda confirmação enquanto o pedido está sendo enviado", async () => {
        let finalizarRequisicao;

        invokeMock.mockImplementation(
                () =>
                        new Promise((resolve) => {
                                finalizarRequisicao = resolve;
                        }),
        );

        expect(invokeMock).not.toHaveBeenCalled();

        // A navegação até a confirmação será adicionada na próxima etapa.
        const user = userEvent.setup();
        render(<Harness />);

        await user.type(screen.getByLabelText("Nome"), "Ana Silva");
        await user.type(screen.getByLabelText("WhatsApp"), "11912345678");

        await user.click(screen.getByRole("button", { name: /Continuar/ }));

        expect(
                await screen.findByRole("button", { name: /Retirada/i })
        ).toBeInTheDocument();

        await waitFor(() => {
                expect(document.querySelector(".checkout-modal"))
                        .not.toHaveClass("checkout-step-enter-right");
        });

        await user.click(screen.getByRole("button", { name: /Retirada/i }));
        await user.click(screen.getByRole("button", { name: /Continuar/i }));

        expect(
                await screen.findByRole("heading", { name: /Local de retirada/i })
        ).toBeInTheDocument();

        await waitFor(() => {
                expect(document.querySelector(".checkout-modal"))
                        .not.toHaveClass("checkout-step-enter-right");
        });

        const pickupButton = document.querySelector(".checkout-pickup-option");

        expect(pickupButton).not.toBeNull();
        await user.click(pickupButton);
        expect(pickupButton).toHaveClass("active");

        await user.click(screen.getByRole("button", { name: /Continuar/i }));

        expect(
                await screen.findByRole("heading", { name: /Resumo do pedido/i })
        ).toBeInTheDocument();

        await waitFor(() => {
                expect(document.querySelector(".checkout-modal"))
                        .not.toHaveClass("checkout-step-enter-right");
        }, { timeout: 2000 });

        await user.click(screen.getByRole("button", { name: /Continuar/i }));

        expect(
                await screen.findByRole("heading", { name: /Forma de pagamento/i })
        ).toBeInTheDocument();

        await waitFor(() => {
                expect(document.querySelector(".checkout-modal"))
                        .not.toHaveClass("checkout-step-enter-right");
        }, { timeout: 2000 });

        const cashButton = [...document.querySelectorAll(".checkout-payment-option")]
                .find((button) => button.textContent.includes("Dinheiro"));

        expect(cashButton).toBeDefined();
        await user.click(cashButton);
        expect(cashButton).toHaveClass("active");

        const noChangeButton = document.querySelectorAll(".checkout-change-option")[1];

        expect(noChangeButton).toBeDefined();
        await user.click(noChangeButton);
        expect(noChangeButton).toHaveClass("active");

        await user.click(screen.getByRole("button", { name: /Continuar/i }));

        expect(
                await screen.findByRole("heading", { name: /Revise seu pedido/i })
        ).toBeInTheDocument();

        expect(
                screen.getByRole("button", { name: /Confirmar pedido/i })
        ).toBeInTheDocument();

        const confirmButton = screen.getByRole("button", {
                name: /Confirmar pedido/i,
        });

        fireEvent.click(confirmButton);
        fireEvent.click(confirmButton);

        await waitFor(() => {
                expect(invokeMock).toHaveBeenCalledTimes(1);
        });

        expect(invokeMock).toHaveBeenCalledWith(
                "criar-pedido",
                expect.any(Object),
        );

        expect(confirmButton).toBeDisabled();

        await user.click(confirmButton);

        expect(invokeMock).toHaveBeenCalledTimes(1);
        expect(typeof finalizarRequisicao).toBe("function");
}, 20000);

