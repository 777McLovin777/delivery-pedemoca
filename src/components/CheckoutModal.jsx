import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function CheckoutModal({
  open,
  onClose,
  customer,
  onCustomerChange,
  subtotal,
}) {
  const dialog = useRef(null);

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [whatsappShake, setWhatsappShake] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("");

  const [needsChange, setNeedsChange] = useState(null);
  const [cashGiven, setCashGiven] = useState("");

  const orderTotal = subtotal + (deliveryFee ?? 0);

  const [address, setAddress] = useState({
    neighborhood: "",
    street: "",
    number: "",
    noNumber: false,
    complement: "",
    reference: "",
  });

  const neighborhoods = [
    "Bandeirantes",
    "Centro",
    "Chácara Boa Vista",
    "Cocho D'água",
    "Estrada da Barragem",
    "Green Hills",
    "Igavetá",
    "Itaquara Parque",
    "Jardim Bom Jesus",
    "Jardim Morro Branco",
    "Parque das Avencas",
    "Parque Laranjeiras",
    "Parque Payol 1",
    "Parque Payol 2",
    "Rasgão",
    "Sidharta",
    "Vila Lolli",
    "Vila Nova",
  ];

  const filteredNeighborhoods = neighborhoods.filter((neighborhood) =>
    neighborhood
      .toLocaleLowerCase("pt-BR")
      .includes(address.neighborhood.toLocaleLowerCase("pt-BR")),
  );

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    dialog.current?.showModal();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;

      dialog.current?.close();
      previousFocus?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setErrors({});
      setDeliveryMethod("");
    }
  }, [open]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const currentContent = dialog.current?.querySelector(".checkout-content");

      if (currentContent) {
        currentContent.scrollTop = 0;
      }
    });
  }, [step]);

  function formatPrice(value) {
    return Number(value).toFixed(2).replace(".", ",");
  }

  function formatPrice(value) {
    return Number(value).toFixed(2).replace(".", ",");
  }

  function formatCurrencyInput(value) {
    const numbers = value.replace(/\D/g, "");

    if (!numbers) return "";

    const amount = Number(numbers) / 100;

    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function currencyInputToNumber(value) {
    const numbers = value.replace(/\D/g, "");

    if (!numbers) return 0;

    return Number(numbers) / 100;
  }

  function formatWhatsapp(value) {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    if (numbers.length <= 2) {
      return numbers.length ? `(${numbers}` : "";
    }

    if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }

    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }

  function triggerWhatsappShake() {
    setWhatsappShake(false);

    requestAnimationFrame(() => {
      setWhatsappShake(true);
    });
  }

  function update(field, value) {
    onCustomerChange({
      ...customer,
      [field]: value,
    });

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function validateCustomer() {
    const nextErrors = {};

    if (!customer.name.trim()) {
      nextErrors.name = "Informe seu nome.";
    }

    const whatsappNumbers = customer.whatsapp.replace(/\D/g, "");

    if (!/^\d{11}$/.test(whatsappNumbers)) {
      nextErrors.whatsapp =
        "Informe um celular com DDD e 9 dígitos. Ex.: (11) 91234-5678.";
    }

    return nextErrors;
  }

  function handleCustomerSubmit(event) {
    event.preventDefault();

    const nextErrors = validateCustomer();

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      const firstErrorField = nextErrors.name ? "name" : "whatsapp";

      if (nextErrors.whatsapp) {
        triggerWhatsappShake();
      }

      dialog.current?.querySelector(`[name="${firstErrorField}"]`)?.focus();

      return;
    }

    onCustomerChange({
      name: customer.name.trim(),
      whatsapp: formatWhatsapp(customer.whatsapp),
    });

    setStep(2);
  }

  function handleDeliveryContinue() {
    if (!deliveryMethod) {
      setErrors({
        deliveryMethod: "Escolha uma opção para continuar.",
      });

      return;
    }

    setErrors({});

    if (deliveryMethod === "delivery") {
      setStep(3);
      return;
    }

    if (deliveryMethod === "pickup") {
      return;
    }
  }

  function updateAddress(field, value) {
    setAddress((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  async function handleCalculateDelivery() {
    const neighborhood = address.neighborhood.trim();
    const street = address.street.trim();
    const number = address.number.trim();

    const nextErrors = {};

    if (!neighborhood) {
      nextErrors.neighborhood = "Selecione seu bairro.";
    } else if (!neighborhoods.includes(neighborhood)) {
      nextErrors.neighborhood = "Selecione um bairro atendido pela Pé de Moça.";
    }

    if (!street) {
      nextErrors.street = "Informe sua rua ou avenida.";
    }

    if (!address.noNumber && !number) {
      nextErrors.number = "Informe o número ou marque S/N.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);

      const firstErrorField = Object.keys(nextErrors)[0];

      dialog.current?.querySelector(`[name="${firstErrorField}"]`)?.focus();

      return;
    }

    setErrors({});
    setDeliveryLoading(true);

    try {
      const { data, error } = await supabase
        .from("delivery_neighborhoods")
        .select("id, name, delivery_fee")
        .eq("name", neighborhood)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        setErrors({
          neighborhood: "Este bairro não está disponível para entrega.",
        });

        return;
      }

      setDeliveryFee(Number(data.delivery_fee));

      console.log("Entrega calculada:", data);

      setStep(4);
    } catch (error) {
      console.error("Erro ao calcular entrega:", error);

      setErrors({
        delivery: "Não foi possível calcular a entrega agora. Tente novamente.",
      });
    } finally {
      setDeliveryLoading(false);
    }
  }

  function handleBack() {
    if (step === 1) {
      onClose();
      return;
    }

    setErrors({});
    setStep(step - 1);
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialog}
      className={`checkout-modal checkout-customer-dialog ${
        step === 3 ? "checkout-address-dialog" : ""
      }`}
      aria-labelledby="checkout-title"
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();

        if (
          event.target === event.currentTarget &&
          (event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom)
        ) {
          onClose();
        }
      }}
    >
      <div className="checkout-notepad-pages" aria-hidden="true">
        <span className="checkout-notepad-page checkout-notepad-page-5" />
        <span className="checkout-notepad-page checkout-notepad-page-4" />
        <span className="checkout-notepad-page checkout-notepad-page-3" />
        <span className="checkout-notepad-page checkout-notepad-page-2" />
        <span className="checkout-notepad-page checkout-notepad-page-1" />
      </div>

      <div className="checkout-notepad-rings" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="checkout-ring-pair" key={index}>
            <span className="checkout-ring" />
            <span className="checkout-ring" />
          </div>
        ))}
      </div>

      <div className="checkout-header">
        <div>
          <span className="checkout-eyebrow">SEU PEDIDO</span>

          <h2 id="checkout-title">Finalizar pedido</h2>
        </div>

        <button
          type="button"
          className="checkout-close"
          onClick={onClose}
          aria-label="Fechar checkout"
        >
          ×
        </button>
      </div>

      {step === 1 && (
        <form
          className="checkout-content checkout-customer-form"
          onSubmit={handleCustomerSubmit}
          noValidate
        >
          <div>
            <h3>Seus dados</h3>

            <p>
              Como podemos chamar você? Informe seu WhatsApp para contato sobre
              o pedido.
            </p>
          </div>

          <div className="checkout-field">
            <label htmlFor="checkout-name">Nome</label>

            <input
              id="checkout-name"
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              placeholder="Seu nome"
              value={customer.name}
              onChange={(event) => update("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "checkout-name-error" : undefined}
            />

            {errors.name && (
              <p
                className="checkout-error"
                id="checkout-name-error"
                role="alert"
              >
                {errors.name}
              </p>
            )}
          </div>

          <div className="checkout-field">
            <label htmlFor="checkout-whatsapp">WhatsApp</label>

            <input
              id="checkout-whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              required
              maxLength={20}
              placeholder="(11) 91234-5678"
              value={customer.whatsapp}
              className={whatsappShake ? "checkout-whatsapp-shake" : ""}
              onChange={(event) => {
                const rawNumbers = event.target.value.replace(/\D/g, "");

                if (rawNumbers.length > 11) {
                  triggerWhatsappShake();
                  return;
                }

                update("whatsapp", formatWhatsapp(event.target.value));
              }}
              onAnimationEnd={() => setWhatsappShake(false)}
              aria-invalid={Boolean(errors.whatsapp)}
              aria-describedby={`checkout-whatsapp-help${
                errors.whatsapp ? " checkout-whatsapp-error" : ""
              }`}
            />

            <p id="checkout-whatsapp-help">Celular com DDD.</p>

            {errors.whatsapp && (
              <p
                className="checkout-error"
                id="checkout-whatsapp-error"
                role="alert"
              >
                {errors.whatsapp}
              </p>
            )}
          </div>

          <button type="submit" className="checkout-button">
            <span>Continuar</span>
            <span>→</span>
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="checkout-content checkout-delivery-form">
          <div>
            <h3>Como você quer receber?</h3>

            <p>Escolha entre receber seu pedido ou retirar com a gente.</p>
          </div>

          <div className="checkout-delivery-options">
            <button
              type="button"
              className={`checkout-delivery-option ${
                deliveryMethod === "delivery" ? "active" : ""
              }`}
              onClick={() => {
                setDeliveryMethod("delivery");
                setErrors({});
              }}
            >
              <span className="checkout-delivery-icon">🚚</span>

              <span>
                <strong>Entrega</strong>
                <small>Receba seu pedido no endereço informado.</small>
              </span>

              <span className="checkout-option-check">
                {deliveryMethod === "delivery" ? "✓" : ""}
              </span>
            </button>

            <button
              type="button"
              className={`checkout-delivery-option ${
                deliveryMethod === "pickup" ? "active" : ""
              }`}
              onClick={() => {
                setDeliveryMethod("pickup");
                setErrors({});
              }}
            >
              <span className="checkout-delivery-icon">🏠</span>

              <span>
                <strong>Retirada</strong>
                <small>Retire seu pedido no ponto da Pé de Moça.</small>
              </span>

              <span className="checkout-option-check">
                {deliveryMethod === "pickup" ? "✓" : ""}
              </span>
            </button>
          </div>

          {errors.deliveryMethod && (
            <p className="checkout-error" role="alert">
              {errors.deliveryMethod}
            </p>
          )}

          <div className="checkout-step-actions">
            <button
              type="button"
              className="checkout-back-button"
              onClick={handleBack}
            >
              <span>←</span>
              <span>Voltar</span>
            </button>

            <button
              type="button"
              className="checkout-button"
              onClick={handleDeliveryContinue}
            >
              <span>Continuar</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {step === 3 && deliveryMethod === "delivery" && (
        <div className="checkout-content checkout-address-form">
          <div>
            <h3>Endereço de entrega</h3>

            <p>Informe onde você quer receber seu pedido.</p>
          </div>

          <div className="checkout-field checkout-neighborhood-field">
            <label htmlFor="checkout-neighborhood">Bairro</label>

            <div
              className="checkout-neighborhood-wrapper"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setNeighborhoodOpen(false);
                }
              }}
            >
              <input
                id="checkout-neighborhood"
                name="neighborhood"
                type="text"
                autoComplete="off"
                placeholder="Digite ou selecione seu bairro"
                value={address.neighborhood}
                onFocus={() => setNeighborhoodOpen(true)}
                onChange={(event) => {
                  updateAddress("neighborhood", event.target.value);
                  setNeighborhoodOpen(true);
                }}
              />

              <button
                type="button"
                className="checkout-neighborhood-toggle"
                aria-label="Mostrar bairros"
                onClick={() => setNeighborhoodOpen((current) => !current)}
              >
                {neighborhoodOpen ? "▲" : "▼"}
              </button>

              {neighborhoodOpen && (
                <div className="checkout-neighborhood-dropdown">
                  {filteredNeighborhoods.length > 0 ? (
                    filteredNeighborhoods.map((neighborhood) => (
                      <button
                        key={neighborhood}
                        type="button"
                        className="checkout-neighborhood-option"
                        onClick={() => {
                          updateAddress("neighborhood", neighborhood);
                          setNeighborhoodOpen(false);
                        }}
                      >
                        {neighborhood}
                      </button>
                    ))
                  ) : (
                    <div className="checkout-neighborhood-empty">
                      Bairro não encontrado
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="checkout-field">
            <label htmlFor="checkout-street">Rua / Avenida</label>

            <input
              id="checkout-street"
              name="street"
              type="text"
              autoComplete="street-address"
              maxLength={150}
              placeholder="Nome da rua ou avenida"
              value={address.street}
              onChange={(event) => updateAddress("street", event.target.value)}
            />
          </div>

          <div className="checkout-address-row">
            <div className="checkout-field">
              <label htmlFor="checkout-number">Número</label>

              <input
                id="checkout-number"
                name="number"
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder={address.noNumber ? "S/N" : "123"}
                value={address.number}
                disabled={address.noNumber}
                onChange={(event) => {
                  const onlyNumbers = event.target.value.replace(/\D/g, "");
                  updateAddress("number", onlyNumbers);
                }}
              />

              <label className="checkout-no-number">
                <input
                  type="checkbox"
                  checked={address.noNumber}
                  onChange={(event) => {
                    const checked = event.target.checked;

                    setAddress((current) => ({
                      ...current,
                      noNumber: checked,
                      number: checked ? "" : current.number,
                    }));
                  }}
                />

                <span>S/N</span>
              </label>
            </div>

            <div className="checkout-field">
              <label htmlFor="checkout-complement">Complemento</label>

              <input
                id="checkout-complement"
                name="complement"
                type="text"
                maxLength={100}
                placeholder="Apto, bloco..."
                value={address.complement}
                onChange={(event) =>
                  updateAddress("complement", event.target.value)
                }
              />
            </div>
          </div>

          <div className="checkout-field">
            <label htmlFor="checkout-reference">Ponto de referência</label>

            <input
              id="checkout-reference"
              name="reference"
              type="text"
              maxLength={150}
              placeholder="Ex.: próximo ao mercado"
              value={address.reference}
              onChange={(event) =>
                updateAddress("reference", event.target.value)
              }
            />
          </div>

          <div className="checkout-step-actions">
            <button
              type="button"
              className="checkout-back-button"
              onClick={handleBack}
            >
              <span>←</span>
              <span>Voltar</span>
            </button>

            <button
              type="button"
              className="checkout-button"
              onClick={handleCalculateDelivery}
              disabled={deliveryLoading}
            >
              <span>
                {deliveryLoading ? "Calculando..." : "Calcular entrega"}
              </span>

              <span>→</span>
            </button>
          </div>
        </div>
      )}
      {step === 4 && deliveryMethod === "delivery" && (
        <div className="checkout-content checkout-summary">
          <div>
            <h3>Resumo do pedido</h3>
            <p>Confira os dados antes de continuar.</p>
          </div>

          <div className="checkout-summary-values">
            <div className="checkout-summary-line">
              <span>Subtotal</span>
              <strong>R$ {formatPrice(subtotal)}</strong>
            </div>

            <div className="checkout-summary-line">
              <span>Entrega — {address.neighborhood}</span>
              <strong>R$ {formatPrice(deliveryFee)}</strong>
            </div>

            <div className="checkout-summary-total">
              <span>Total</span>
              <strong>R$ {formatPrice(orderTotal)}</strong>
            </div>
          </div>

          <div className="checkout-summary-address">
            <span className="checkout-summary-address-title">ENTREGAR EM</span>

            <div className="checkout-summary-address-main">
              <strong>
                {address.street}, {address.noNumber ? "S/N" : address.number}
              </strong>

              <p>{address.neighborhood}</p>
            </div>

            {(address.complement || address.reference) && (
              <div className="checkout-summary-address-details">
                {address.complement && (
                  <div>
                    <span>COMPLEMENTO</span>
                    <strong>{address.complement}</strong>
                  </div>
                )}

                {address.reference && (
                  <div>
                    <span>PONTO DE REFERÊNCIA</span>
                    <strong>{address.reference}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="checkout-step-actions">
            <button
              type="button"
              className="checkout-back-button"
              onClick={handleBack}
            >
              <span>←</span>
              <span>Voltar</span>
            </button>

            <button
              type="button"
              className="checkout-button"
              onClick={() => {
                setErrors({});
                setStep(5);
              }}
            >
              <span>Continuar</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="checkout-content checkout-payment-form">
          <div>
            <h3>Forma de pagamento</h3>
            <p>Como você prefere pagar seu pedido?</p>
          </div>

          <div className="checkout-payment-options">
            <button
              type="button"
              className={`checkout-payment-option ${
                paymentMethod === "pix" ? "active" : ""
              }`}
              onClick={() => {
                setPaymentMethod("pix");
                setErrors({});
              }}
            >
              <span className="checkout-payment-icon">◆</span>

              <span>
                <strong>PIX</strong>
                <small>Pagamento rápido e fácil.</small>
              </span>

              <span className="checkout-option-check">
                {paymentMethod === "pix" ? "✓" : ""}
              </span>
            </button>

            <button
              type="button"
              className={`checkout-payment-option ${
                paymentMethod === "cash" ? "active" : ""
              }`}
              onClick={() => {
                setPaymentMethod("cash");
                setErrors({});
              }}
            >
              <span className="checkout-payment-icon">R$</span>

              <span>
                <strong>Dinheiro</strong>
                <small>Pague na entrega.</small>
              </span>

              <span className="checkout-option-check">
                {paymentMethod === "cash" ? "✓" : ""}
              </span>
            </button>
          </div>

          {paymentMethod === "cash" && (
            <div className="checkout-change-box">
              <div className="checkout-change-heading">
                <strong>Precisa de troco?</strong>
                <small>Informe se deseja receber troco no pagamento.</small>
              </div>

              <div className="checkout-change-options">
                <button
                  type="button"
                  className={`checkout-change-option ${
                    needsChange === true ? "active" : ""
                  }`}
                  onClick={() => {
                    setNeedsChange(true);
                    setErrors({});
                  }}
                >
                  Sim
                </button>

                <button
                  type="button"
                  className={`checkout-change-option ${
                    needsChange === false ? "active" : ""
                  }`}
                  onClick={() => {
                    setNeedsChange(false);
                    setCashGiven("");
                    setErrors({});
                  }}
                >
                  Não
                </button>
              </div>

              {needsChange === true && (
                <div className="checkout-field checkout-cash-field">
                  <label htmlFor="checkout-cash-given">
                    Troco para quanto?
                  </label>

                  <input
                    id="checkout-cash-given"
                    name="cashGiven"
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={cashGiven}
                    onChange={(event) => {
                      setCashGiven(formatCurrencyInput(event.target.value));

                      setErrors((current) => ({
                        ...current,
                        cashGiven: undefined,
                      }));
                    }}
                  />

                  {errors.cashGiven && (
                    <p className="checkout-error" role="alert">
                      {errors.cashGiven}
                    </p>
                  )}

                  {currencyInputToNumber(cashGiven) >= orderTotal &&
                    currencyInputToNumber(cashGiven) > 0 && (
                      <div className="checkout-change-result">
                        <span>Seu troco</span>

                        <strong>
                          R${" "}
                          {formatPrice(
                            currencyInputToNumber(cashGiven) - orderTotal,
                          )}
                        </strong>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {errors.needsChange && (
            <p className="checkout-error" role="alert">
              {errors.needsChange}
            </p>
          )}

          {errors.paymentMethod && (
            <p className="checkout-error" role="alert">
              {errors.paymentMethod}
            </p>
          )}

          <div className="checkout-step-actions">
            <button
              type="button"
              className="checkout-back-button"
              onClick={handleBack}
            >
              <span>←</span>
              <span>Voltar</span>
            </button>

            <button
              type="button"
              className="checkout-button"
              onClick={() => {
                if (!paymentMethod) {
                  setErrors({
                    paymentMethod: "Escolha uma forma de pagamento.",
                  });
                  return;
                }

                if (paymentMethod === "cash" && needsChange === null) {
                  setErrors({
                    needsChange: "Informe se você precisa de troco.",
                  });
                  return;
                }

                if (paymentMethod === "cash" && needsChange === true) {
                  const cashValue = currencyInputToNumber(cashGiven);

                  if (!cashGiven || cashValue <= 0) {
                    setErrors({
                      cashGiven: "Informe para quanto você precisa de troco.",
                    });
                    return;
                  }

                  if (cashValue < orderTotal) {
                    setErrors({
                      cashGiven: `O valor precisa ser de pelo menos R$ ${formatPrice(
                        orderTotal,
                      )}.`,
                    });
                    return;
                  }
                }

                setErrors({});
                setStep(6);
              }}
            >
              <span>Continuar</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
      {step === 6 && (
        <div className="checkout-content checkout-final-review">
          <div>
            <h3>Revise seu pedido</h3>
            <p>Confira os dados antes de confirmar.</p>
          </div>

          <div className="checkout-final-section">
            <span className="checkout-final-label">CLIENTE</span>

            <div className="checkout-final-inline">
              <strong>{customer.name}</strong>
              <span className="checkout-final-dot">•</span>
              <p>{customer.whatsapp}</p>
            </div>
          </div>

          {deliveryMethod === "delivery" && (
            <div className="checkout-final-section">
              <span className="checkout-final-label">ENTREGA</span>

              <strong>
                {address.street}, {address.noNumber ? "S/N" : address.number}
              </strong>

              <p>{address.neighborhood}</p>

              {address.complement && <p>Complemento: {address.complement}</p>}

              {address.reference && <p>Referência: {address.reference}</p>}
            </div>
          )}

          <div className="checkout-final-section">
            <span className="checkout-final-label">PAGAMENTO</span>

            {paymentMethod === "pix" && (
              <div className="checkout-final-inline">
                <strong>PIX</strong>
                <span className="checkout-final-dot">•</span>
                <p>Pagamento via PIX.</p>
              </div>
            )}

            {paymentMethod === "cash" && (
              <>
                {needsChange === false && (
                  <div className="checkout-final-inline">
                    <strong>Dinheiro</strong>
                    <span className="checkout-final-dot">•</span>
                    <p>Não precisa de troco.</p>
                  </div>
                )}

                {needsChange === true && (
                  <>
                    <div className="checkout-final-inline">
                      <strong>Dinheiro</strong>
                      <span className="checkout-final-dot">•</span>
                      <p>Troco para {cashGiven}</p>
                    </div>

                    <p className="checkout-final-change">
                      Troco:{" "}
                      <strong>
                        R${" "}
                        {formatPrice(
                          currencyInputToNumber(cashGiven) - orderTotal,
                        )}
                      </strong>
                    </p>
                  </>
                )}
              </>
            )}
          </div>

          <div className="checkout-final-values">
            <div>
              <span>Subtotal</span>
              <strong>R$ {formatPrice(subtotal)}</strong>
            </div>

            <div>
              <span>Entrega</span>
              <strong>R$ {formatPrice(deliveryFee ?? 0)}</strong>
            </div>

            <div className="checkout-final-total">
              <span>Total</span>
              <strong>R$ {formatPrice(orderTotal)}</strong>
            </div>
          </div>

          <div className="checkout-step-actions">
            <button
              type="button"
              className="checkout-back-button"
              onClick={handleBack}
            >
              <span>←</span>
              <span>Voltar</span>
            </button>

            <button
              type="button"
              className="checkout-button"
              onClick={() => {
                console.log("Pedido pronto para confirmação.");
              }}
            >
              <span>Confirmar pedido</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
