import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import CheckoutPageCurl from "./CheckoutPageCurl";
import { neighborhoods } from "../data/neighborhoods";

export default function CheckoutModal({
  open,
  onClose,
  customer,

  onCustomerChange,

  savedAddresses = [],

  customerEmail = "",

  subtotal,
  cart,
  onOrderSuccess,
}) {
  const dialog = useRef(null);
  const viewportFrame = useRef(null);
  const curl = useRef(null);
  const page = useRef(null);
  const navigationLock = useRef(false);
  const transition = useRef(null);
  const session = useRef(0);
  const freightRequest = useRef(0);
  const addressVersion = useRef(0);
  const currentAddress = useRef("");
  const freightPending = useRef(false);
  const focusAfterNavigation = useRef(false);
  const [navigationBusy, setNavigationBusy] = useState(false);

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [pickupLocation, setPickupLocation] = useState(null);
  const [whatsappShake, setWhatsappShake] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState(null);
  const [deliveryNeighborhoodId, setDeliveryNeighborhoodId] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [payerEmail, setPayerEmail] = useState("");

  useEffect(() => {
    if (!open) return;

    setPayerEmail((current) => current || customerEmail);
  }, [open, customerEmail]);

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

  /* =========================================================
     CHECKOUT - PREENCHER ENDEREÇO PRINCIPAL
  ========================================================= */

  const addressInitialized = useRef(false);

  useEffect(() => {
    if (!open) {
      addressInitialized.current = false;
      return;
    }

    if (addressInitialized.current) return;

    const primaryAddress = savedAddresses.find(
      (item) => item.principal === true,
    );

    if (!primaryAddress) return;

    addressInitialized.current = true;

    setAddress({
      neighborhood: primaryAddress.bairro || "",
      street: primaryAddress.rua || "",
      number:
        primaryAddress.numero?.toUpperCase() === "S/N"
          ? ""
          : primaryAddress.numero || "",
      noNumber: primaryAddress.numero?.toUpperCase() === "S/N",
      complement: primaryAddress.complemento || "",
      reference: primaryAddress.referencia || "",
    });
  }, [open, savedAddresses]);

  const [pickupLocations, setPickupLocations] = useState([]);
  const [pickupLocationsLoading, setPickupLocationsLoading] = useState(false);
  const [checkoutToken, setCheckoutToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // APENAS PARA TESTE VISUAL LOCAL — remover antes de publicar.
  const previewPix = false;
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open && !checkoutToken) {
      setCheckoutToken(crypto.randomUUID());
    }

    if (!open) {
      setCheckoutToken(null);
    }
  }, [open, checkoutToken]);

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

    const viewport = window.visualViewport;

    function updateCheckoutViewport() {
      if (!dialog.current) return;

      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;

      dialog.current.style.setProperty(
        "--checkout-visible-height",
        `${height}px`,
      );

      dialog.current.style.setProperty(
        "--checkout-visible-top",
        `${offsetTop}px`,
      );
    }

    function scheduleViewportUpdate() {
      cancelAnimationFrame(viewportFrame.current);

      viewportFrame.current = requestAnimationFrame(updateCheckoutViewport);
    }

    scheduleViewportUpdate();

    viewport?.addEventListener("resize", scheduleViewportUpdate);
    viewport?.addEventListener("scroll", scheduleViewportUpdate);
    window.addEventListener("resize", scheduleViewportUpdate);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;

      viewport?.removeEventListener("resize", scheduleViewportUpdate);
      viewport?.removeEventListener("scroll", scheduleViewportUpdate);
      window.removeEventListener("resize", scheduleViewportUpdate);

      cancelAnimationFrame(viewportFrame.current);

      dialog.current?.close();
      previousFocus?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setNavigationBusy(false);
      setStep(1);
      setErrors({});
      setDeliveryMethod("");

      setPickupLocation(null);

      setDeliveryFee(null);
      setDeliveryNeighborhoodId(null);
      setDeliveryLoading(false);

      setPaymentMethod("");
      setPayerEmail("");
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
      } catch {
        console.error("Erro ao carregar pontos de retirada.");

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

  const invalidateFreight = useCallback(() => {
    freightRequest.current += 1;
    freightPending.current = false;
    setDeliveryLoading(false);
  }, []);

  useLayoutEffect(() => {
    const snapshot = JSON.stringify(address);
    if (currentAddress.current !== snapshot) {
      currentAddress.current = snapshot;
      addressVersion.current += 1;
      if (freightPending.current) invalidateFreight();
    }
  }, [address, invalidateFreight]);

  useLayoutEffect(() => {
    if (!open) return;
    session.current += 1;
    return () => {
      session.current += 1;
      freightRequest.current += 1;
      freightPending.current = false;
      transition.current = null;
      navigationLock.current = false;
      focusAfterNavigation.current = false;
      curl.current?.cancel();
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    if (transition.current?.committed && transition.current.target === step) {
      curl.current?.reveal();
    }
    if (!navigationBusy && focusAfterNavigation.current) {
      focusAfterNavigation.current = false;
      const content = page.current?.querySelector(".checkout-content");
      if (content) content.scrollTop = 0;
      const title = content?.querySelector("h3") || page.current?.querySelector("h2");
      title?.setAttribute("tabindex", "-1");
      title?.focus({ preventScroll: true });
    }
  }, [step, navigationBusy, open]);



  function closeCheckout() {
    session.current += 1;
    invalidateFreight();
    transition.current = null;
    navigationLock.current = false;
    focusAfterNavigation.current = false;
    curl.current?.cancel();
    setNavigationBusy(false);
    onClose();
  }

  // Acquire before validation/normalization, including inline navigation handlers.
  function guardNavigation(action, holdUntilSettled = false) {
    return (...args) => {
      args[0]?.preventDefault?.();
      if (navigationLock.current || submitting) return;
      navigationLock.current = true;
      const actionSession = session.current;
      let awaiting = false;
      try {
        const result = action(...args);
        if (holdUntilSettled) {
          awaiting = true;
          return Promise.resolve(result).finally(() => {
            if (session.current === actionSession && !transition.current) navigationLock.current = false;
          });
        }
        return result;
      } finally {
        if (!transition.current && !awaiting) navigationLock.current = false;
      }
    };
  }

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


      setCreatedOrder(data);

      if (paymentMethod === "cash") {
        onOrderSuccess?.();
      }
    } catch {
      console.error("Erro ao criar pedido.");

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

  function changeCheckoutStep(nextStep) {
    if (transition.current || nextStep === step) return;
    const operation = { session: session.current, target: nextStep, committed: false };
    transition.current = operation;
    navigationLock.current = true;
    setNavigationBusy(true);
    setNeighborhoodOpen(false);
    dialog.current?.focus({ preventScroll: true });
    curl.current.start({
      from: step,
      to: nextStep,
      commit() {
        if (transition.current !== operation || session.current !== operation.session || operation.committed) return;
        operation.committed = true;
        setStep(nextStep);
      },
      complete() {
        if (transition.current !== operation || session.current !== operation.session) return;
        transition.current = null;
        navigationLock.current = false;
        focusAfterNavigation.current = true;
        setNavigationBusy(false);
      },
    });
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

    changeCheckoutStep(2);
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
      changeCheckoutStep(3);

      return;
    }

    if (deliveryMethod === "pickup") {
      setDeliveryFee(0);
      changeCheckoutStep(3);

      return;
    }
  }

  function handleSelectSavedAddress(addressId) {
    invalidateFreight();
    addressVersion.current += 1;
    if (addressId === "manual") {
      setAddress({
        neighborhood: "",
        street: "",
        number: "",
        noNumber: false,
        complement: "",
        reference: "",
      });
    } else {
      const selectedAddress = savedAddresses.find(
        (item) => item.id === addressId,
      );

      if (!selectedAddress) return;

      const savedNumber = String(selectedAddress.numero || "");
      const isNoNumber = savedNumber.toUpperCase() === "S/N";

      setAddress({
        neighborhood: selectedAddress.bairro || "",
        street: selectedAddress.rua || "",
        number: isNoNumber ? "" : savedNumber,
        noNumber: isNoNumber,
        complement: selectedAddress.complemento || "",
        reference: selectedAddress.referencia || "",
      });
    }

    setDeliveryFee(null);
    setDeliveryNeighborhoodId(null);
    setErrors({});
    setNeighborhoodOpen(false);
  }

  function updateAddress(field, value) {
    invalidateFreight();
    addressVersion.current += 1;
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
    if (freightPending.current) return;
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
    freightPending.current = true;
    const request = ++freightRequest.current;
    const requestSession = session.current;
    const version = addressVersion.current;
    const snapshot = JSON.stringify(address);
    const isCurrent = () => request === freightRequest.current &&
      requestSession === session.current && version === addressVersion.current &&
      snapshot === currentAddress.current;

    try {
      const { data, error } = await supabase
        .from("delivery_neighborhoods")
        .select("id, name, delivery_fee")
        .eq("name", neighborhood)
        .eq("is_active", true)
        .maybeSingle();

      if (!isCurrent()) return;
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


      changeCheckoutStep(4);
    } catch {
      if (!isCurrent()) return;
      console.error("Erro ao calcular entrega.");

      setErrors({
        delivery: "Não foi possível calcular a entrega agora. Tente novamente.",
      });
    } finally {
      if (isCurrent()) {
        freightPending.current = false;
        setDeliveryLoading(false);
      }
    }
  }

  function handleBack() {
    invalidateFreight();
    if (step === 1) {
      closeCheckout();
      return;
    }

    setErrors({});
    changeCheckoutStep(step - 1);
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialog}
      className={`checkout-modal checkout-customer-dialog ${
        step === 3 ? "checkout-address-dialog" : ""
      }`}
      tabIndex={-1}
      aria-busy={navigationBusy}
      onClickCapture={(event) => {
        if (navigationLock.current && page.current?.contains(event.target)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      aria-labelledby="checkout-title"
      onCancel={(event) => { event.preventDefault(); closeCheckout(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeCheckout();
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
          closeCheckout();
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

      <CheckoutPageCurl ref={curl} pageRef={page} />

      {/* Diagonais posicionadas atrás do caderninho */}
      <div className="checkout-spiral-rear">
        <svg
          className="checkout-spiral-svg"
          viewBox="0 0 595 48"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="checkout-rear-metal"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="var(--brown)" />
              <stop offset="50%" stopColor="var(--cream)" />
              <stop offset="100%" stopColor="var(--brown)" />
            </linearGradient>
          </defs>

          {Array.from({ length: 6 }).map((_, index) => {
            const x = 20 + index * (555 / 5);

            return (
              <path
                key={index}
                d={`M ${x + 2} 8 L ${x + 19} 19.66`}
                fill="none"
                stroke="url(#checkout-rear-metal)"
                strokeWidth="7"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>

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

            {Array.from({ length: 6 }).map((_, index) => {
              const x = 20 + index * (555 / 5);
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
                </g>
              );
            })}
          </svg>
        </div>
        <span className="checkout-eyebrow">SEU PEDIDO</span>

        <button
          type="button"
          className="checkout-close"
          onClick={closeCheckout}
          aria-label="Fechar checkout"
        >
          ×
        </button>
      </div>

      {/* ?rvore ?nica: o HTML desvanece; apenas o SVG representa a dobra. */}
      <div
        ref={page}
        className={`checkout-page checkout-page-test-${((step - 1) % 3) + 1}`}
      >
        <div className="checkout-header">
          <div>
            <h2 id="checkout-title">Finalizar pedido</h2>
          </div>
        </div>

        {(previewPix || (createdOrder && paymentMethod === "pix")) && (
          <div className="checkout-content checkout-success">
            <div className="checkout-success-heading">
              <span>PAGAMENTO PIX</span>
              <h3>Aguardando pagamento</h3>

              <p>
                Seu pedido foi registrado, mas o pagamento ainda não foi
                confirmado.
              </p>
            </div>

            <div className="checkout-success-order">
              <span>NÚMERO DO PEDIDO</span>
              <strong>
                #{previewPix ? "000123" : createdOrder.order_number}
              </strong>
            </div>

            <div className="checkout-success-total">
              <span>Total a pagar</span>
              <strong>
                R$ {previewPix ? "35,90" : formatPrice(createdOrder.total)}
              </strong>
            </div>

            <p>
              O código PIX será disponibilizado aqui quando a geração do
              pagamento estiver ativada.
            </p>
          </div>
        )}
        {!previewPix && !createdOrder && step === 1 && (
          <form
            className="checkout-content checkout-customer-form"
            onSubmit={guardNavigation(handleCustomerSubmit)}
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
                onClick={closeCheckout}
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
                onClick={guardNavigation(handleBack)}
              >
                <span>←</span>
                <span>Voltar</span>
              </button>

              <button
                type="button"
                className="checkout-button"
                onClick={guardNavigation(handleDeliveryContinue)}
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

            {savedAddresses.length > 0 && (
              <div className="checkout-field">
                <label htmlFor="checkout-saved-address">
                  Usar endereço cadastrado
                </label>

                <select
                  id="checkout-saved-address"
                  className="checkout-saved-address-select"
                  defaultValue={
                    savedAddresses.find((item) => item.principal)?.id ||
                    "manual"
                  }
                  onChange={(event) =>
                    handleSelectSavedAddress(event.target.value)
                  }
                >
                  {savedAddresses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.apelido || "Endereço"}
                      {item.principal ? " ⭐" : ""}
                      {" — "}
                      {item.rua}, {item.numero}
                    </option>
                  ))}

                  <option value="manual">Preencher outro endereço</option>
                </select>
              </div>
            )}

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
                  className="checkout-neighborhood-input"
                  autoComplete="off"
                  placeholder="Digite ou selecione seu bairro"
                  value={address.neighborhood}
                  onFocus={() => setNeighborhoodOpen(true)}
                  onChange={(event) => {
                    updateAddress("neighborhood", event.target.value);
                    setNeighborhoodOpen(true);
                  }}
                  aria-expanded={neighborhoodOpen}
                  aria-invalid={Boolean(errors.neighborhood)}
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

                      invalidateFreight();
                      addressVersion.current += 1;
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
                onClick={guardNavigation(handleBack)}
              >
                <span>←</span>
                <span>Voltar</span>
              </button>

              <button
                type="button"
                className="checkout-button"
                onClick={guardNavigation(handleCalculateDelivery)}
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
                onClick={guardNavigation(handleBack)}
              >
                <span>←</span>
                <span>Voltar</span>
              </button>

              <button
                type="button"
                className="checkout-button"
                onClick={guardNavigation(() => {
                  if (!pickupLocation) {
                    setErrors({
                      pickupLocation: "Escolha um local para retirada.",
                    });

                    triggerInvalidShake(".checkout-pickup-options");

                    return;
                  }

                  setErrors({});
                  changeCheckoutStep(4);
                })}
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
                onClick={guardNavigation(handleBack)}
              >
                <span>←</span>
                <span>Voltar</span>
              </button>

              <button
                type="button"
                className="checkout-button"
                onClick={guardNavigation(() => {
                  setErrors({});
                  changeCheckoutStep(5);
                })}
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
                onClick={guardNavigation(handleBack)}
              >
                <span>←</span>
                <span>Voltar</span>
              </button>

              <button
                type="button"
                className="checkout-button"
                onClick={guardNavigation(() => {
                  setErrors({});
                  changeCheckoutStep(5);
                })}
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

            {paymentMethod === "pix" && (
              <div className="checkout-field checkout-pix-email">
                <label htmlFor="checkout-pix-email">
                  E-mail para pagamento PIX
                </label>

                <input
                  id="checkout-pix-email"
                  name="payerEmail"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="seuemail@exemplo.com"
                  maxLength={254}
                  value={payerEmail}
                  onChange={(event) => {
                    setPayerEmail(event.target.value);

                    setErrors((current) => ({
                      ...current,
                      payerEmail: undefined,
                    }));
                  }}
                  aria-invalid={Boolean(errors.payerEmail)}
                  aria-describedby={
                    errors.payerEmail ? "checkout-pix-email-error" : undefined
                  }
                />

                {errors.payerEmail && (
                  <p
                    className="checkout-error"
                    id="checkout-pix-email-error"
                    role="alert"
                  >
                    {errors.payerEmail}
                  </p>
                )}

                <small>
                  Usaremos este e-mail para gerar seu pagamento PIX.
                </small>
              </div>
            )}

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
                onClick={guardNavigation(handleBack)}
              >
                <span>←</span>
                <span>Voltar</span>
              </button>

              <button
                type="button"
                className="checkout-button"
                onClick={guardNavigation(() => {
                  if (!paymentMethod) {
                    setErrors({
                      paymentMethod: "Escolha uma forma de pagamento.",
                    });

                    triggerInvalidShake(".checkout-payment-options");

                    return;
                  }

                  if (paymentMethod === "pix") {
                    const email = payerEmail.trim();

                    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                      setErrors({
                        payerEmail: !email
                          ? "Informe seu e-mail para pagar com PIX."
                          : "Informe um e-mail válido.",
                      });

                      triggerInvalidShake('[name="payerEmail"]');

                      dialog.current
                        ?.querySelector('[name="payerEmail"]')
                        ?.focus();

                      return;
                    }
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
                  changeCheckoutStep(6);
                })}
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
                onClick={guardNavigation(handleBack)}
              >
                <span>←</span>
                <span>Voltar</span>
              </button>

              <button
                type="button"
                className="checkout-button"
                onClick={guardNavigation(handleConfirmOrder, true)}
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
