import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function CheckoutModal({
  open,
  onClose,
  customer,
  onCustomerChange,
  subtotal,
  cart,
  onOrderSuccess,
}) {
  const dialog = useRef(null);
  const pageTimer = useRef(null);

  const [step, setStep] = useState(1);
  const [pageAnimation, setPageAnimation] = useState("");
  const [pageDirection, setPageDirection] = useState("forward");
  const [errors, setErrors] = useState({});
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [pickupLocation, setPickupLocation] = useState(null);
  const [whatsappShake, setWhatsappShake] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState(null);
  const [deliveryNeighborhoodId, setDeliveryNeighborhoodId] = useState(null);
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

  const [pickupLocations, setPickupLocations] = useState([]);
  const [pickupLocationsLoading, setPickupLocationsLoading] = useState(false);
  const [checkoutToken, setCheckoutToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open && !checkoutToken) {
      setCheckoutToken(crypto.randomUUID());
    }

    if (!open) {
      setCheckoutToken(null);
    }
  }, [open, checkoutToken]);

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

      setPickupLocation(null);

      setDeliveryFee(null);
      setDeliveryNeighborhoodId(null);
      setDeliveryLoading(false);

      setPaymentMethod("");
      setNeedsChange(null);
      setCashGiven("");

      setAddress({
        neighborhood: "",
        street: "",
        number: "",
        noNumber: false,
        complement: "",
        reference: "",
      });

      setNeighborhoodOpen(false);

      setCreatedOrder(null);
      setSubmitting(false);
      setSubmitError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadPickupLocations() {
      setPickupLocationsLoading(true);

      try {
        const { data, error } = await supabase
          .from("pickup_locations")
          .select("id, name, address, number, neighborhood")
          .eq("is_active", true)
          .order("id", { ascending: true });

        if (error) {
          throw error;
        }

        if (!cancelled) {
          setPickupLocations(
            (data ?? [])
              .sort((a, b) => {
                const order = {
                  "Morro Branco": 1,
                  "Vila Nova": 2,
                };

                return (order[a.name] ?? 99) - (order[b.name] ?? 99);
              })
              .map((location, index) => ({
                ...location,
                displayName: `Ponto ${index + 1} • ${location.name}`,
              })),
          );
        }
      } catch (error) {
        console.error("Erro ao carregar pontos de retirada:", error);

        if (!cancelled) {
          setPickupLocations([]);
        }
      } finally {
        if (!cancelled) {
          setPickupLocationsLoading(false);
        }
      }
    }

    loadPickupLocations();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const currentContent = dialog.current?.querySelector(".checkout-content");

      if (currentContent) {
        currentContent.scrollTop = 0;
      }
    });
  }, [step]);

  function buildOrderItems() {
    return cart.map((item) => ({
      id: item.id,
      baseProductId: item.baseProductId ?? null,
      quantity: item.quantity,
      customizations: item.customizations ?? null,
      observation: item.observation ?? "",
    }));
  }

  async function handleConfirmOrder() {
    const orderItems = buildOrderItems();

    const orderPayload = {
      checkoutToken,

      customerName: customer.name,
      customerPhone: customer.whatsapp,

      fulfillmentType: deliveryMethod,

      deliveryNeighborhoodId:
        deliveryMethod === "delivery" ? deliveryNeighborhoodId : null,

      deliveryAddress: deliveryMethod === "delivery" ? address.street : null,

      deliveryNumber:
        deliveryMethod === "delivery"
          ? address.noNumber
            ? "S/N"
            : address.number
          : null,

      deliveryComplement:
        deliveryMethod === "delivery" ? address.complement : null,

      deliveryReference:
        deliveryMethod === "delivery" ? address.reference : null,

      pickupLocationId:
        deliveryMethod === "pickup" ? (pickupLocation?.id ?? null) : null,

      paymentMethod,

      cashGiven:
        paymentMethod === "cash" && needsChange === true
          ? currencyInputToNumber(cashGiven)
          : null,

      items: orderItems,
    };

    if (submitting) {
      return;
    }

    setSubmitError("");
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("criar-pedido", {
        body: orderPayload,
      });

      if (error) {
        throw error;
      }

      console.log("PEDIDO CRIADO:", data);
      setCreatedOrder(data);
      onOrderSuccess?.();
    } catch (error) {
      console.error("ERRO AO CRIAR PEDIDO:", error);

      setSubmitError(
        "Não foi possível confirmar seu pedido agora. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
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

  function triggerInvalidShake(selector) {
    const element = dialog.current?.querySelector(selector);

    if (!element) return;

    element.classList.remove("checkout-invalid-shake");

    requestAnimationFrame(() => {
      element.classList.add("checkout-invalid-shake");
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

  function changeCheckoutStep(nextStep, direction = "forward") {
    if (pageAnimation) return;

    setPageDirection(direction);

    const exitAnimation =
      direction === "forward"
        ? "checkout-step-exit-left"
        : "checkout-step-exit-right";

    const enterAnimation =
      direction === "forward"
        ? "checkout-step-enter-right"
        : "checkout-step-enter-left";

    setPageAnimation(exitAnimation);

    clearTimeout(pageTimer.current);

    pageTimer.current = setTimeout(
      () => {
        setStep(nextStep);
        setPageAnimation(enterAnimation);

        pageTimer.current = setTimeout(
          () => {
            setPageAnimation("");
          },
          direction === "backward" ? 650 : 500,
        );
      },
      direction === "backward" ? 500 : 650,
    );
  }

  function handleCustomerSubmit(event) {
    event.preventDefault();

    const nextErrors = validateCustomer();

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      const firstErrorField = nextErrors.name ? "name" : "whatsapp";

      triggerInvalidShake(`[name="${firstErrorField}"]`);

      dialog.current?.querySelector(`[name="${firstErrorField}"]`)?.focus();

      return;
    }

    onCustomerChange({
      name: customer.name.trim(),
      whatsapp: formatWhatsapp(customer.whatsapp),
    });

    changeCheckoutStep(2, "forward");
  }

  function handleDeliveryContinue() {
    if (!deliveryMethod) {
      setErrors({
        deliveryMethod: "Escolha uma opção para continuar.",
      });

      triggerInvalidShake(".checkout-delivery-options");

      return;
    }

    setErrors({});

    if (deliveryMethod === "delivery") {
      changeCheckoutStep(3, "forward");

      return;
    }

    if (deliveryMethod === "pickup") {
      setDeliveryFee(0);
      changeCheckoutStep(3, "forward");

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

      triggerInvalidShake(`[name="${firstErrorField}"]`);

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

      setDeliveryNeighborhoodId(data.id);
      setDeliveryFee(Number(data.delivery_fee));

      console.log("Entrega calculada:", data);

      changeCheckoutStep(4, "forward");
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
    changeCheckoutStep(step - 1, "backward");
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialog}
      className={`checkout-modal checkout-customer-dialog ${
        step === 3 ? "checkout-address-dialog" : ""
      } ${pageAnimation}`}
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
        {Array.from({ length: Math.max(0, 6 - step) }).map((_, index) => {
          const pageNumber = 5 - index;

          return (
            <span
              key={pageNumber}
              className={`checkout-notepad-page checkout-notepad-page-${pageNumber}`}
            />
          );
        })}
      </div>

      {/* Folha de fundo durante a virada */}
      {pageAnimation === "checkout-step-exit-left" && (
        <div
          className={`checkout-next-sheet checkout-next-sheet-${
            (step % 3) + 1
          }`}
          aria-hidden="true"
        />
      )}

      {/* Folha decorativa que vira sobre a próxima página */}
      {/* Folha decorativa — avançar e voltar */}
      {(pageAnimation === "checkout-step-exit-left" ||
        pageAnimation === "checkout-step-exit-right") && (
        <div
          className={`checkout-flip-sheet checkout-flip-sheet-${
            ((step - 1) % 3) + 1
          } ${
            pageAnimation === "checkout-step-exit-right"
              ? "checkout-flip-sheet-backward"
              : ""
          }`}
          aria-hidden="true"
        >
          <div className="checkout-flip-sheet-front" />
          <div className="checkout-flip-sheet-back" />
        </div>
      )}

      {/* Região superior fixa, fora da folha animada */}

      <div className="checkout-fixed-header">
        {/* Espiral do bloquinho */}
        <div className="checkout-spiral" aria-hidden="true">
          <svg
            viewBox="0 0 600 48"
            preserveAspectRatio="none"
            className="checkout-spiral-svg"
          >
            <defs>
              <linearGradient
                id="checkout-spiral-metal"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#222222" />
                <stop offset="45%" stopColor="#777777" />
                <stop offset="100%" stopColor="#202020" />
              </linearGradient>
              <mask
                id="checkout-spiral-back-mask"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="600"
                height="48"
              >
                <rect x="0" y="0" width="600" height="17" fill="white" />
              </mask>
            </defs>

            {/* Camada independente das diagonais traseiras */}
            <g
              className="checkout-spiral-back-wires"
              mask="url(#checkout-spiral-back-mask)"
            >
              {Array.from({ length: 10 }).map((_, index) => {
                const x = 20 + index * (555 / 9);

                return (
                  <path
                    key={index}
                    d={`M ${x + 2} 8 L ${x + 19} 19.66`}
                    fill="none"
                    stroke="url(#checkout-spiral-metal)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    opacity="1"
                  />
                );
              })}
            </g>

            {Array.from({ length: 10 }).map((_, index) => {
              const x = 20 + index * (555 / 9);

              return (
                <g key={index}>
                  {/* Furo com profundidade */}
                  {/* Borda interna do papel perfurado */}
                  <ellipse
                    cx={x}
                    cy="34"
                    rx="8"
                    ry="10"
                    fill="var(--brown)"
                    opacity="0.25"
                  />

                  {/* Interior escuro do furo */}
                  <ellipse cx={x} cy="32" rx="6" ry="8" fill="var(--brown)" />

                  {/* Reflexo na borda inferior do papel */}
                  <path
                    d={`M ${x - 5} 38 Q ${x} 43 ${x + 5} 38`}
                    fill="none"
                    stroke="var(--cream)"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />

                  {/* Arame frontal — desce reto até o furo */}
                  <path
                    d={`M ${x} 32 L ${x} 9 Q ${x} 3 ${x + 5} 5`}
                    fill="none"
                    stroke="url(#checkout-spiral-metal)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Reflexo metálico na parte frontal */}
                  <path
                    d={`M ${x - 1.5} 29 L ${x - 1.5} 10`}
                    fill="none"
                    stroke="var(--white)"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    opacity="0.35"
                  />
                  {/* Acabamento dobrado da primeira argola */}
                  {index === 0 && (
                    <path
                      d={`M ${x} 32
        Q ${x - 7} 36 ${x - 10} 29
        Q ${x - 12} 25 ${x - 8} 23`}
                      fill="none"
                      stroke="url(#checkout-spiral-metal)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <span className="checkout-eyebrow">SEU PEDIDO</span>

        <button
          type="button"
          className="checkout-close"
          onClick={onClose}
          aria-label="Fechar checkout"
        >
          ×
        </button>
      </div>

      {/* Folha que participa da virada */}
      <div
        className={`checkout-page checkout-page-test-${((step - 1) % 3) + 1}`}
      >
        <div className="checkout-header">
          <div>
            <h2 id="checkout-title">Finalizar pedido</h2>
          </div>
        </div>

        {createdOrder && (
          <div className="checkout-content checkout-success">
            <div className="checkout-success-icon">✓</div>

            <div className="checkout-success-heading">
              <span>SEU PEDIDO</span>
              <h3>Pedido confirmado!</h3>

              <p>
                Recebemos seu pedido com sucesso.
                <br />
                Agora é só aguardar o preparo.
              </p>
            </div>

            <div className="checkout-success-order">
              <span>NÚMERO DO PEDIDO</span>
              <strong>#{createdOrder.order_number}</strong>
            </div>

            <div className="checkout-success-total">
              <span>Total</span>
              <strong>R$ {formatPrice(createdOrder.total)}</strong>
            </div>

            <button type="button" className="checkout-button" onClick={onClose}>
              <span>Fechar</span>
              <span>✓</span>
            </button>
          </div>
        )}

        {!createdOrder && step === 1 && (
          <form
            className="checkout-content checkout-customer-form"
            onSubmit={handleCustomerSubmit}
            noValidate
          >
            <div>
              <h3>Seus dados</h3>

              <p>
                Como podemos chamar você? Informe seu WhatsApp para contato
                sobre o pedido.
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
                aria-describedby={
                  errors.name ? "checkout-name-error" : undefined
                }
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
                placeholder="(11) 99999-9999"
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

            <div className="checkout-actions">
              <button
                type="button"
                className="checkout-back-button"
                onClick={onClose}
              >
                <span>←</span>
                <span>Voltar</span>
              </button>

              <button type="submit" className="checkout-button">
                <span>Continuar</span>
                <span>→</span>
              </button>
            </div>
          </form>
        )}

        {!createdOrder && step === 2 && (
          <div className="checkout-content checkout-delivery-form">
            <div>
              <h3>Como você quer receber?</h3>

              <p>Escolha entre receber seu pedido ou retirar com a gente.</p>
            </div>

            <div
              className={`checkout-delivery-options ${
                errors.deliveryMethod ? "checkout-options-error" : ""
              }`}
            >
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

        {!createdOrder && step === 3 && deliveryMethod === "delivery" && (
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
                onChange={(event) =>
                  updateAddress("street", event.target.value)
                }
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

        {!createdOrder && step === 3 && deliveryMethod === "pickup" && (
          <div className="checkout-content checkout-pickup-form">
            <div>
              <h3>Local de retirada</h3>

              <p>Escolha onde você prefere retirar seu pedido.</p>
            </div>

            <div
              className={`checkout-pickup-options ${
                errors.pickupLocation ? "checkout-options-error" : ""
              }`}
            >
              {pickupLocations.map((location) => {
                const isSelected = pickupLocation?.id === location.id;

                return (
                  <button
                    key={location.id}
                    type="button"
                    className={`checkout-pickup-option ${
                      isSelected ? "active" : ""
                    }`}
                    onClick={() => {
                      setPickupLocation(location);

                      setErrors((current) => ({
                        ...current,
                        pickupLocation: undefined,
                      }));
                    }}
                  >
                    <span className="checkout-delivery-icon">🏠</span>

                    <span className="checkout-pickup-info">
                      <strong>{location.displayName}</strong>

                      <small>
                        {location.address}, {location.number}
                      </small>

                      <small>{location.neighborhood}</small>
                    </span>

                    <span className="checkout-option-check">
                      {isSelected ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>

            {errors.pickupLocation && (
              <p className="checkout-error" role="alert">
                {errors.pickupLocation}
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
                  if (!pickupLocation) {
                    setErrors({
                      pickupLocation: "Escolha um local para retirada.",
                    });

                    triggerInvalidShake(".checkout-pickup-options");

                    return;
                  }

                  setErrors({});
                  changeCheckoutStep(4, "forward");
                }}
              >
                <span>Continuar</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {!createdOrder && step === 4 && deliveryMethod === "delivery" && (
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
              <span className="checkout-summary-address-title">
                ENTREGAR EM
              </span>

              <div className="checkout-summary-address-main">
                <div className="checkout-final-inline">
                  <strong>
                    {address.street},{" "}
                    {address.noNumber ? "S/N" : address.number}
                  </strong>

                  <span className="checkout-final-dot">,</span>

                  <strong>{address.neighborhood}</strong>
                </div>
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
                  changeCheckoutStep(5, "forward");
                }}
              >
                <span>Continuar</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {!createdOrder && step === 4 && deliveryMethod === "pickup" && (
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
                <span>Retirada</span>

                <strong>Grátis</strong>
              </div>

              <div className="checkout-summary-total">
                <span>Total</span>

                <strong>R$ {formatPrice(subtotal)}</strong>
              </div>
            </div>

            <div className="checkout-summary-address">
              <span className="checkout-summary-address-title">
                RETIRADA EM
              </span>

              <div className="checkout-summary-address-main">
                <strong>{pickupLocation.name}</strong>

                <strong className="checkout-pickup-summary-address">
                  {pickupLocation.address}, {pickupLocation.number},{" "}
                  {pickupLocation.neighborhood}
                </strong>
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
                  setErrors({});
                  changeCheckoutStep(5, "forward");
                }}
              >
                <span>Continuar</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
        {!createdOrder && step === 5 && (
          <div className="checkout-content checkout-payment-form">
            <div>
              <h3>Forma de pagamento</h3>
              <p>Como você prefere pagar seu pedido?</p>
            </div>

            <div
              className={`checkout-payment-options ${
                errors.paymentMethod ? "checkout-options-error" : ""
              }`}
            >
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

                <div
                  className={`checkout-change-options ${
                    errors.needsChange ? "checkout-options-error" : ""
                  }`}
                >
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

                    triggerInvalidShake(".checkout-payment-options");

                    return;
                  }

                  if (paymentMethod === "cash" && needsChange === null) {
                    setErrors({
                      needsChange: "Informe se você precisa de troco.",
                    });

                    triggerInvalidShake(".checkout-change-options");

                    return;
                  }

                  if (paymentMethod === "cash" && needsChange === true) {
                    const cashValue = currencyInputToNumber(cashGiven);

                    if (!cashGiven || cashValue <= 0) {
                      setErrors({
                        cashGiven: "Informe para quanto você precisa de troco.",
                      });

                      triggerInvalidShake('[name="cashGiven"]');

                      dialog.current
                        ?.querySelector('[name="cashGiven"]')
                        ?.focus();

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
                  changeCheckoutStep(6, "forward");
                }}
              >
                <span>Continuar</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
        {!createdOrder && step === 6 && (
          <div className="checkout-content checkout-final-review">
            <div>
              <h3>Revise seu pedido</h3>
              <p>Confira os dados antes de confirmar.</p>
            </div>

            <div className="checkout-final-section">
              <span className="checkout-final-label">CLIENTE</span>

              <div className="checkout-final-client">
                <strong className="checkout-final-client-name">
                  {customer.name}
                </strong>

                <span className="checkout-final-client-dot">•</span>

                <strong className="checkout-final-client-phone">
                  {customer.whatsapp}
                </strong>
              </div>
            </div>

            {deliveryMethod === "delivery" && (
              <div className="checkout-final-section">
                <span className="checkout-final-label">ENTREGA</span>

                <div className="checkout-final-inline">
                  <strong>
                    {address.street},{" "}
                    {address.noNumber ? "S/N" : address.number}
                  </strong>

                  <span className="checkout-final-dot">,</span>

                  <strong>{address.neighborhood}</strong>
                </div>

                {address.complement && <p>Complemento: {address.complement}</p>}

                {address.reference && <p>Referência: {address.reference}</p>}
              </div>
            )}

            {deliveryMethod === "pickup" && pickupLocation && (
              <div className="checkout-final-section">
                <span className="checkout-final-label">RETIRADA EM</span>

                <strong>{pickupLocation.name}</strong>

                <p className="checkout-pickup-final-address">
                  {pickupLocation.address}, {pickupLocation.number},{" "}
                  {pickupLocation.neighborhood}
                </p>
              </div>
            )}

            <div className="checkout-final-section">
              <span className="checkout-final-label">PAGAMENTO</span>

              {paymentMethod === "pix" && (
                <div className="checkout-final-inline">
                  <strong>PIX</strong>
                  <span className="checkout-final-dot">•</span>
                  <strong>Pagamento via PIX.</strong>
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
                        <strong>
                          Troco: R${" "}
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
                <span>
                  {deliveryMethod === "delivery" ? "Entrega" : "Retirada"}
                </span>

                <strong>
                  {deliveryMethod === "delivery"
                    ? `R$ ${formatPrice(deliveryFee ?? 0)}`
                    : "Grátis"}
                </strong>
              </div>

              <div className="checkout-final-total">
                <span>Total</span>
                <strong>R$ {formatPrice(orderTotal)}</strong>
              </div>
            </div>

            {submitError && (
              <p className="checkout-submit-error" role="alert">
                {submitError}
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
                onClick={handleConfirmOrder}
                disabled={submitting}
              >
                <span>
                  {submitting ? "Confirmando..." : "Confirmar pedido"}
                </span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
