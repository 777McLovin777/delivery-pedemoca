import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import CheckoutModal from "../components/CheckoutModal";

beforeEach(() => {
	HTMLDialogElement.prototype.showModal = vi.fn(function () {
		this.setAttribute("open", "");
	});
	HTMLDialogElement.prototype.close = vi.fn();
});
function Harness() {
	const [customer, setCustomer] = useState({ name: "", whatsapp: "" });
	return (
		<CheckoutModal
			open
			onClose={() => {}}
			customer={customer}
			onCustomerChange={setCustomer}
		/>
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



