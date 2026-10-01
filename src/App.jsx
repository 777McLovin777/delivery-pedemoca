import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./App.css";

import logo from "./assets/logo.png";
import escrita from "./assets/Escrita.png";
import logonova from "./assets/logonova.png";
import baixo from "./assets/baixo.png";

import banoffe from "./assets/banoffe.jpeg";
import tiramisu from "./assets/tiramisu.jpeg";
import tortinha from "./assets/tortinha.jpeg";

import carrinho from "./assets/carrinho.png";
import insta from "./assets/insta.png";
import whats from "./assets/whats.png";

import agua from "./assets/agua.png";
import aguagas from "./assets/aguagas.png";
import coca from "./assets/coca.png";
import cocazero from "./assets/cocazero.png";

import seta from "./assets/seta.png";

/* =========================================================
   PRODUTOS
========================================================= */

const products = [
  {
    id: 1,
    name: "Banoffee",
    category: "Mais pedidos",
    description:
      "Banana, doce de leite e chantilly em uma combinação irresistível.",
    price: 15.9,
    image: banoffe,
  },
  {
    id: 2,
    name: "Tiramisù",
    category: "Mais pedidos",
    description: "Creme suave, café e cacau para quem gosta de um clássico.",
    price: 16.9,
    image: tiramisu,
  },
  {
    id: 3,
    name: "Tortinha",
    category: "Tortinhas",
    description: "Massa delicada, recheio cremoso e uma cobertura especial.",
    price: 14.9,
    image: tortinha,
  },
];

const menuProducts = [
  {
    id: 101,
    name: "Brownie de Chocolate ao Leite",
    category: "Brownies",
    description:
      "Brownie de chocolate ao leite com opção de castanhas ou frutas vermelhas.",
    price: 12.9,
    image: tortinha,
  },
  {
    id: 102,
    name: "Brownie de Chocolate Branco",
    category: "Brownies",
    description:
      "Brownie de chocolate branco com opção de castanhas ou frutas vermelhas.",
    price: 13.9,
    image: tortinha,
  },
  {
    id: 103,
    name: "Banoffee",
    category: "Tortas",
    description:
      "Banana, doce de leite e chantilly em uma combinação irresistível.",
    price: 15.9,
    image: banoffe,
  },
  {
    id: 104,
    name: "Torta de Uva",
    category: "Tortas",
    description:
      "Uvas frescas, creme suave e uma combinação delicada e irresistível.",
    price: 15.9,
    image: banoffe,
  },
  {
    id: 105,
    name: "Mousse de Oreo",
    category: "Mousses",
    description:
      "Mousse cremoso de Oreo para quem não resiste a esse clássico.",
    price: 10.9,
    image: tiramisu,
  },
  {
    id: 106,
    name: "Mousse de Café",
    category: "Mousses",
    description: "Mousse cremoso com sabor marcante de café.",
    price: 10.9,
    image: tiramisu,
  },
  {
    id: 107,
    name: "Tiramisù",
    category: "Clássicos",
    description: "Creme suave, café e cacau para quem gosta de um clássico.",
    price: 16.9,
    image: tiramisu,
  },
];

const newCategoryProducts = {
  "Doces autorais": [
    {
      id: 201,
      name: "Pé de Moça Gourmet no Pote",
      category: "Doces autorais",
      description:
        "Nosso clássico Pé de Moça em uma versão gourmet para comer de colher.",
      price: 14.9,
      image: tortinha,
    },
  ],

  Bebidas: [
    {
      id: 208,
      name: "Água sem gás 500 ml",
      category: "Bebidas",
      description: "Água mineral sem gás.",
      price: 4.0,
      image: agua,
    },
    {
      id: 209,
      name: "Água com gás 500 ml",
      category: "Bebidas",
      description: "Água mineral com gás.",
      price: 4.5,
      image: aguagas,
    },
    {
      id: 210,
      name: "Coca-Cola 350 ml",
      category: "Bebidas",
      description: "Coca-Cola lata 350 ml.",
      price: 6.0,
      image: coca,
    },
    {
      id: 211,
      name: "Coca-Cola Zero 350 ml",
      category: "Bebidas",
      description: "Coca-Cola Zero lata 350 ml.",
      price: 6.0,
      image: cocazero,
    },
  ],
};

/* =========================================================
   CATEGORIAS
========================================================= */

const categoryRoutes = {
  doces: "Doces autorais",
  brownies: "Brownies",
  tortas: "Tortas",
  mousses: "Mousses",
  bebidas: "Bebidas",
};

const categoryOptions = [
  "Doces autorais",
  "Brownies",
  "Tortas",
  "Mousses",
  "Bebidas",
];

const menuCategories = ["Brownies", "Tortas", "Mousses", "Clássicos"];

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function formatPrice(value) {
  return Number(value).toFixed(2).replace(".", ",");
}

function getCategorySlug(category) {
  if (category === "Doces autorais") {
    return "doces";
  }

  return category.toLowerCase();
}

/* =========================================================
   APP
========================================================= */

function App() {
  /* =======================================================
     ESTADOS
  ======================================================= */

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("pedemoca-cart");

      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);

  const [cartAnimating, setCartAnimating] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const [customizingProduct, setCustomizingProduct] = useState(null);

  const [selectedComplements, setSelectedComplements] = useState({});

  const [productQuantity, setProductQuantity] = useState(1);

  /* =======================================================
     LOCAL STORAGE
  ======================================================= */

  useEffect(() => {
    localStorage.setItem("pedemoca-cart", JSON.stringify(cart));
  }, [cart]);

  /* =======================================================
     CARRINHO
  ======================================================= */

  function openCart() {
    setCartAnimating(true);
    setCartOpen(true);

    setTimeout(() => {
      setCartAnimating(false);
    }, 280);
  }

  function addToCart(product) {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id && !item.customizationKey,
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id && !item.customizationKey
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    openCart();
  }

  function increaseQuantity(productId, customizationKey = undefined) {
    setCart((currentCart) =>
      currentCart.map((item) => {
        const sameProduct =
          item.id === productId && item.customizationKey === customizationKey;

        if (!sameProduct) {
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }),
    );
  }

  function decreaseQuantity(productId, customizationKey = undefined) {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          const sameProduct =
            item.id === productId && item.customizationKey === customizationKey;

          if (!sameProduct) {
            return item;
          }

          return {
            ...item,
            quantity: item.quantity - 1,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }
  function clearCart() {
    setCart([]);
  }

  /* =======================================================
   PERSONALIZAÇÃO DO PRODUTO
======================================================= */

  function openProductCustomization(product) {
    setCustomizingProduct(product);
    setSelectedComplements({});
    setProductQuantity(1);
  }

  function closeProductCustomization() {
    setCustomizingProduct(null);
    setSelectedComplements({});
    setProductQuantity(1);
  }

  function changeComplementQuantity(complement, amount) {
    setSelectedComplements((current) => {
      const currentQuantity = current[complement] || 0;

      const newQuantity = Math.max(0, currentQuantity + amount);

      return {
        ...current,
        [complement]: newQuantity,
      };
    });
  }

  function changeProductQuantity(amount) {
    setProductQuantity((current) => Math.max(1, current + amount));
  }

  function confirmProductCustomization() {
    if (!customizingProduct) {
      return;
    }

    const isBrownie = customizingProduct.category === "Brownies";

    const castanhas = selectedComplements["Castanhas"] || 0;
    const frutasVermelhas = selectedComplements["Frutas Vermelhas"] || 0;

    const complementPrice = castanhas * 2.5 + frutasVermelhas * 2.5;

    const unitPrice =
      customizingProduct.price + (isBrownie ? complementPrice : 0);

    const customizations = isBrownie
      ? {
          Castanhas: castanhas,
          "Frutas Vermelhas": frutasVermelhas,
        }
      : null;

    setCart((currentCart) => {
      if (!isBrownie) {
        const existingProduct = currentCart.find(
          (item) => item.id === customizingProduct.id && !item.customizationKey,
        );

        if (existingProduct) {
          return currentCart.map((item) =>
            item.id === customizingProduct.id && !item.customizationKey
              ? {
                  ...item,
                  quantity: item.quantity + productQuantity,
                }
              : item,
          );
        }

        return [
          ...currentCart,
          {
            ...customizingProduct,
            quantity: productQuantity,
          },
        ];
      }

      const customizationKey = [
        customizingProduct.id,
        castanhas,
        frutasVermelhas,
      ].join("-");

      const existingProduct = currentCart.find(
        (item) => item.customizationKey === customizationKey,
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.customizationKey === customizationKey
            ? {
                ...item,
                quantity: item.quantity + productQuantity,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          ...customizingProduct,
          id: `${customizingProduct.id}-${Date.now()}`,
          baseProductId: customizingProduct.id,
          customizationKey,
          customizations,
          price: unitPrice,
          quantity: productQuantity,
        },
      ];
    });

    closeProductCustomization();
    openCart();
  }

  /* =======================================================
     VALORES DO CARRINHO
  ======================================================= */

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  /* =======================================================
     ROTAS
  ======================================================= */

  const currentPath = window.location.pathname;

  const isMenuPage =
    currentPath === "/cardapio" || currentPath.startsWith("/cardapio/");

  const categoryPath = currentPath.split("/").filter(Boolean)[1];

  const currentCategory = categoryRoutes[categoryPath];

  /* =======================================================
     PRODUTOS DAS CATEGORIAS
  ======================================================= */

  const categories = menuCategories.map((category) => ({
    name: category,
    products: menuProducts.filter((product) => product.category === category),
  }));

  function getCategoryProducts(category) {
    if (category === "Doces autorais") {
      return newCategoryProducts["Doces autorais"];
    }

    if (category === "Bebidas") {
      return newCategoryProducts.Bebidas;
    }

    return menuProducts.filter((product) => product.category === category);
  }

  /* =======================================================
     COMPONENTE: CARD DO PRODUTO
  ======================================================= */

  function ProductCard({ product }) {
    const isBrownie = product.category === "Brownies";
    const isBeverage = product.category === "Bebidas";

    function handleAdd() {
      if (isBeverage) {
        addToCart(product);
        return;
      }

      openProductCustomization(product);
    }

    return (
      <article
        className={`product-card ${
          product.id === 208 || product.id === 209 ? "water-product" : ""
        }`}
        key={product.id}
        onClick={() => {
          if (!isBeverage) {
            openProductCustomization(product);
          }
        }}
      >
        {" "}
        <div className="product-image">
          <img src={product.image} alt={product.name} />

          <span className="product-tag">{product.category}</span>

          <button
            className="quick-add"
            onClick={(event) => {
              event.stopPropagation();
              handleAdd();
            }}
            aria-label={`Adicionar ${product.name}`}
          >
            +
          </button>
        </div>
        <div className="product-content">
          <div className="product-title">
            <h3>{product.name}</h3>

            <strong>R$ {formatPrice(product.price)}</strong>
          </div>

          <p>{product.description}</p>

          <button
            className="add-button"
            onClick={(event) => {
              event.stopPropagation();
              handleAdd();
            }}
          >
            <span translate="no">Adicionar ao pedido</span>

            <span translate="no">+</span>
          </button>
        </div>
      </article>
    );
  }

  /* =======================================================
     COMPONENTE: CARRINHO
  ======================================================= */

  function CartDrawer() {
    if (!cartOpen) {
      return null;
    }

    return (
      <div className="cart-overlay" onClick={() => setCartOpen(false)}>
        <aside
          className={`cart ${cartAnimating ? "cart-opening" : ""}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="cart-header">
            <div>
              <h2>Carrinho</h2>
              <span>SEU PEDIDO</span>
            </div>

            <button
              className="close-cart"
              onClick={() => setCartOpen(false)}
              aria-label="Fechar carrinho"
            >
              ×
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <span className="cart-icon">
                <img src={carrinho} alt="Carrinho" />
              </span>

              <h3>Seu carrinho está vazio</h3>

              <p>Escolha um docinho para começar.</p>

              <button onClick={() => setCartOpen(false)}>
                <span>Ver cardápio</span>
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <img src={item.image} alt={item.name} />

                    <div className="cart-item-info">
                      <div className="cart-item-top">
                        <div>
                          <h3>{item.name}</h3>

                          {item.customizations && (
                            <div className="cart-customizations">
                              {item.customizations["Castanhas"] > 0 && (
                                <span>
                                  Castanhas × {item.customizations["Castanhas"]}
                                </span>
                              )}

                              {item.customizations["Frutas Vermelhas"] > 0 && (
                                <span>
                                  Frutas Vermelhas ×{" "}
                                  {item.customizations["Frutas Vermelhas"]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <strong>
                          R$ {formatPrice(item.price * item.quantity)}
                        </strong>
                      </div>

                      <div className="quantity">
                        <button
                          onClick={() =>
                            decreaseQuantity(item.id, item.customizationKey)
                          }
                          aria-label={`Diminuir quantidade de ${item.name}`}
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() =>
                            increaseQuantity(item.id, item.customizationKey)
                          }
                          aria-label={`Aumentar quantidade de ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <button className="clear-cart-button" onClick={clearCart}>
                  Limpar carrinho
                </button>

                <div className="cart-line">
                  <span>Subtotal</span>

                  <strong>R$ {formatPrice(totalPrice)}</strong>
                </div>

                <div className="cart-line delivery-line">
                  <span>Entrega</span>

                  <span>Calculada no próximo passo</span>
                </div>

                <div className="cart-total">
                  <span>Total</span>

                  <strong>R$ {formatPrice(totalPrice)}</strong>
                </div>

                <button
                  className="checkout-button"
                  onClick={() => alert("Próxima etapa: endereço e pagamento!")}
                >
                  <span>Continuar pedido</span>

                  <span>→</span>
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    );
  }

  /* =======================================================
   COMPONENTE: MODAL DO PRODUTO
======================================================= */

  function ProductModal() {
    const modalContentRef = useRef(null);
    const modalScrollRef = useRef(0);

    useLayoutEffect(() => {
      if (modalContentRef.current) {
        modalContentRef.current.scrollTop = modalScrollRef.current;
      }
    }, [selectedComplements, productQuantity]);

    if (!customizingProduct) {
      return null;
    }

    const isBrownie = customizingProduct.category === "Brownies";

    const castanhas = selectedComplements["Castanhas"] || 0;

    const frutasVermelhas = selectedComplements["Frutas Vermelhas"] || 0;

    const complementsTotal = castanhas * 2.5 + frutasVermelhas * 2.5;

    const unitPrice =
      customizingProduct.price + (isBrownie ? complementsTotal : 0);

    const totalPrice = unitPrice * productQuantity;

    function saveModalScroll() {
      if (modalContentRef.current) {
        modalScrollRef.current = modalContentRef.current.scrollTop;
      }
    }

    return (
      <div className="brownie-overlay" onClick={closeProductCustomization}>
        <div
          ref={modalContentRef}
          className="brownie-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="brownie-close"
            onClick={closeProductCustomization}
            aria-label="Fechar"
          >
            ×
          </button>

          <div className="product-modal-image">
            <img src={customizingProduct.image} alt={customizingProduct.name} />
          </div>

          <span className="brownie-modal-label">
            {isBrownie
              ? "PERSONALIZE SEU BROWNIE"
              : customizingProduct.category.toUpperCase()}
          </span>

          <h2>{customizingProduct.name}</h2>

          <p className="brownie-modal-description">
            {customizingProduct.description}
          </p>

          {isBrownie && (
            <div className="brownie-options">
              <div className="brownie-option">
                <div>
                  <div className="brownie-option-name">
                    <strong>
                      Castanhas <b>+ R$ 2,50</b>
                    </strong>
                  </div>

                  <span>Nozes, castanha e frutos secos</span>
                </div>

                <div className="complement-quantity">
                  <button
                    type="button"
                    disabled={!castanhas}
                    onClick={() => {
                      saveModalScroll();
                      changeComplementQuantity("Castanhas", -1);
                    }}
                  >
                    −
                  </button>

                  <span>{castanhas}</span>

                  <button
                    type="button"
                    onClick={() => {
                      saveModalScroll();
                      changeComplementQuantity("Castanhas", 1);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="brownie-option">
                <div>
                  <strong>
                    Frutas Vermelhas <b>+ R$ 2,50</b>
                  </strong>

                  <span>Morango, framboesa e amora</span>
                </div>

                <div className="complement-quantity">
                  <button
                    type="button"
                    disabled={!frutasVermelhas}
                    onClick={() => {
                      saveModalScroll();
                      changeComplementQuantity("Frutas Vermelhas", -1);
                    }}
                  >
                    −
                  </button>

                  <span>{frutasVermelhas}</span>

                  <button
                    type="button"
                    onClick={() => {
                      saveModalScroll();
                      changeComplementQuantity("Frutas Vermelhas", 1);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="product-modal-quantity">
            <span>Quantidade</span>

            <div className="complement-quantity">
              <button
                type="button"
                disabled={productQuantity <= 1}
                onClick={() => {
                  saveModalScroll();
                  changeProductQuantity(-1);
                }}
              >
                −
              </button>

              <span>{productQuantity}</span>

              <button
                type="button"
                onClick={() => {
                  saveModalScroll();
                  changeProductQuantity(1);
                }}
              >
                +
              </button>
            </div>
          </div>

          <div className="brownie-modal-total">
            <span>Total</span>

            <strong>R$ {formatPrice(totalPrice)}</strong>
          </div>

          <button
            className="brownie-confirm"
            type="button"
            onClick={confirmProductCustomization}
          >
            Adicionar ao pedido
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     COMPONENTE: REDES SOCIAIS
  ======================================================= */

  function SocialSection() {
    return (
      <section className="social-section">
        <div className="social-contact">
          <a
            href="https://www.instagram.com/docepedemoca/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-item"
          >
            <img src={insta} alt="Instagram" />

            <span>@docepedemoca</span>
          </a>

          <a
            href="https://wa.me/5511910513097"
            target="_blank"
            rel="noopener noreferrer"
            className="social-item"
          >
            <img src={whats} alt="WhatsApp" />

            <span> contato </span>
          </a>
        </div>
      </section>
    );
  }

  /* =======================================================
     COMPONENTE: HEADER DO CARDÁPIO
  ======================================================= */

  function MenuHeader() {
    return (
      <header className="header">
        <a href="/" className="brand">
          <img className="brand-writing" src={escrita} alt="Pé de Moça" />
        </a>

        <button
          className={`header-cart ${totalItems > 0 ? "has-items" : ""}`}
          onClick={openCart}
          aria-label="Abrir carrinho"
        >
          <span className="cart-icon">
            <img src={carrinho} alt="Carrinho" />
          </span>

          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </button>
      </header>
    );
  }

  /* =======================================================
     PÁGINA: CATEGORIA DO CARDÁPIO
  ======================================================= */

  function ScrollTopButton() {
    const [revealProgress, setRevealProgress] = useState(0);

    useEffect(() => {
      let ticking = false;

      function handleScroll() {
        if (ticking) return;

        ticking = true;

        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const pageHeight =
            document.documentElement.scrollHeight - window.innerHeight;

          const revealDistance = 800;
          const distanceFromBottom = pageHeight - scrollPosition;

          let progress = (revealDistance - distanceFromBottom) / revealDistance;

          progress = Math.max(0, Math.min(1, progress));

          setRevealProgress(progress);
          ticking = false;
        });
      }

      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();

      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, []);

    function scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: "auto",
      });
    }
    if (cartOpen) {
      return null;
    }
    return (
      <button
        className="scroll-top-button"
        onClick={scrollToTop}
        aria-label="Voltar ao topo"
        style={{
          opacity: revealProgress,
          transform: `translateY(${40 - revealProgress * 40}px)`,
          pointerEvents: revealProgress > 0.05 ? "auto" : "none",
        }}
      >
        <img src={seta} alt="Voltar ao topo" />
      </button>
    );
  }

  if (isMenuPage && currentCategory) {
    const categoryPageProducts = getCategoryProducts(currentCategory);

    return (
      <div className="app menu-page">
        <MenuHeader />

        <main className="menu-main">
          <div className="menu-category-options">
            {categoryOptions.map((category) => (
              <a
                key={category}
                href={`/cardapio/${getCategorySlug(category)}`}
                className={`menu-category-option ${
                  currentCategory === category ? "active" : ""
                }`}
              >
                {category}
              </a>
            ))}
          </div>

          <section className="menu-category-page">
            <div className="products-grid">
              {categoryPageProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          <div className="menu-back-home">
            <a href="/cardapio">← Voltar ao cardápio</a>
          </div>
        </main>

        <ScrollTopButton />
        <ProductModal />
        <CartDrawer />
      </div>
    );
  }

  /* =======================================================
     PÁGINA: CARDÁPIO COMPLETO
  ======================================================= */

  if (isMenuPage) {
    return (
      <div className="app menu-page">
        <MenuHeader />

        <main className="full-menu">
          <div className="menu-category-options">
            {categoryOptions.map((category) => (
              <a
                key={category}
                href={`/cardapio/${getCategorySlug(category)}`}
                className="menu-category-option"
              >
                {category}
              </a>
            ))}
          </div>

          <section className="menu-hero"></section>

          {categories.map((category) => (
            <section
              className={`menu-category category-${category.name.toLowerCase()}`}
              key={category.name}
            >
              <div className="menu-category-heading">
                <h2>{category.name}</h2>
              </div>

              <div className="products-grid">
                {category.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}
        </main>

        <a href="/" className="menu-back-home">
          ← Voltar para o início
        </a>

        <div className="menu-footer-brand">
          <img src={baixo} alt="Pé de Moça" className="menu-footer-image" />
        </div>
        <SocialSection />

        <ScrollTopButton />
        <ProductModal />
        <CartDrawer />
      </div>
    );
  }

  /* =======================================================
     PÁGINA: HOME
  ======================================================= */

  return (
    <div className="app">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">
        <div className="header-left">
          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu"
          >
            ☰
          </button>

          <a href="#inicio" className="brand">
            <img className="brand-writing" src={escrita} alt="Pé de Moça" />
          </a>
        </div>

        <nav className={`navigation ${menuOpen ? "navigation-open" : ""}`}>
          <a href="#inicio" onClick={() => setMenuOpen(false)}>
            Início
          </a>

          <a href="#cardapio" onClick={() => setMenuOpen(false)}>
            Cardápio
          </a>

          <a href="#sobre" onClick={() => setMenuOpen(false)}>
            Sobre nós
          </a>
        </nav>

        <button
          className="header-cart"
          onClick={openCart}
          aria-label="Abrir carrinho"
        >
          <span className="cart-icon">
            <img src={carrinho} alt="Carrinho" />
          </span>

          <span className="cart-text">Carrinho</span>

          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </button>
      </header>

      <main>
        {/* =================================================
            HERO
        ================================================= */}

        <section className="hero" id="inicio">
          <div className="hero-content">
            <span className="hero-small-title">
              DOCES ARTESANAIS • DESDE 2026
            </span>

            <h1>
              Um doce motivo
              <br />
              para pedir mais um.
            </h1>

            <p>
              Pequenos momentos ficam ainda melhores quando têm gosto de Pé de
              Moça.
            </p>

            <div className="hero-buttons">
              <a href="#cardapio" className="primary-button">
                Ver cardápio
                <span>→</span>
              </a>

              <a href="#sobre" className="secondary-button">
                Conheça a gente
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-circle">
              <img src={logonova} alt="Pé de Moça" />
            </div>
          </div>
        </section>

        {/* =================================================
            CATEGORIAS
        ================================================= */}

        <section className="categories-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ESCOLHA SEU MOMENTO</span>

              <h2>O que vai adoçar seu dia?</h2>
            </div>

            <p>
              Tem doce para dividir.
              <br />
              Tem doce para não dividir também.
            </p>
          </div>

          <div className="category-grid">
            <a href="/cardapio/doces" className="category-card category-red">
              <strong>
                <span>Doces Autorais</span>
              </strong>
              <small>Ver opções →</small>
            </a>

            <a
              href="/cardapio/brownies"
              className="category-card category-blue"
            >
              <strong>
                <span>Brownies</span>
              </strong>
              <small>Ver opções →</small>
            </a>

            <a
              href="/cardapio/tortas"
              className="category-card category-yellow"
            >
              <strong>
                <span>Tortas</span>
              </strong>
              <small>Ver opções →</small>
            </a>

            <a href="/cardapio/mousses" className="category-card category-pink">
              <strong>
                <span>Mousses</span>
              </strong>
              <small>Ver opções →</small>
            </a>
          </div>
        </section>

        {/* =================================================
            CARDÁPIO
        ================================================= */}

        <section className="menu-section" id="cardapio">
          <div className="menu-title">
            <div>
              <span className="eyebrow">OS QUERIDINHOS</span>

              <h2>Mais pedidos</h2>
            </div>

            <a href="/cardapio" className="view-all">
              Ver cardápio completo →
            </a>
          </div>

          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* =================================================
            SOBRE
        ================================================= */}

        <section className="about-section" id="sobre">
          <div className="about-logonova">
            <img src={logonova} alt="Pé de Moça" />
          </div>

          <div className="about-content">
            <span className="eyebrow">UMA HISTÓRIA QUE ESTÁ COMEÇANDO</span>

            <h2>
              Feito à mão.
              <br />
              <span>Pensado nos detalhes.</span>
            </h2>

            <p>
              A Pé de Moça nasceu para transformar doces em pequenos momentos
              especiais. Cada receita, cada detalhe e cada pedido carregam um
              pouco da nossa personalidade.
            </p>

            <p>Divertida, artesanal e sem medo de sair do comum.</p>

            <a href="/cardapio" className="about-button">
              Quero um docinho →
            </a>
          </div>
        </section>

        {/* ===================================================
          REDES SOCIAIS
      =================================================== */}

        <SocialSection />

        {/* =================================================
            FRASE FINAL
        ================================================= */}

        <section className="final-section">
          <span>
            PÉ DE MOÇA • DOCERIA ARTESANAL
            <br />
            SINCE 2026
          </span>

          <h2>
            A vida fica mais gostosa
            <br />
            com um pouquinho de doce.
          </h2>
        </section>
      </main>

      {/* ===================================================
          MODAIS
      =================================================== */}

      <ScrollTopButton />
      <ProductModal />
      <CartDrawer />
    </div>
  );
}

export default App;
