import { useState } from "react";
import "./App.css";

import logo from "./assets/logo.png";
import headerLogo from "./assets/Pe de Moca.png";
import banoffe from "./assets/banoffe.jpeg";
import tiramisu from "./assets/tiramisu.jpeg";
import tortinha from "./assets/tortinha.jpeg";
import escrita from "./assets/Escrita.png";

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
    description:
      "Creme suave, café e cacau para quem gosta de um clássico.",
    price: 16.9,
    image: tiramisu,
  },
  {
    id: 3,
    name: "Tortinha",
    category: "Tortinhas",
    description:
      "Massa delicada, recheio cremoso e uma cobertura especial.",
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
    description:
      "Mousse cremoso com sabor marcante de café.",
    price: 10.9,
    image: tiramisu,
  },
  {
    id: 107,
    name: "Tiramisù",
    category: "Clássicos",
    description:
      "Creme suave, café e cacau para quem gosta de um clássico.",
    price: 16.9,
    image: tiramisu,
  },
];

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [customizingBrownie, setCustomizingBrownie] = useState(null);
  const [selectedComplements, setSelectedComplements] = useState({});

  function openBrownieCustomization(product) {
    setCustomizingBrownie(product);
    setSelectedComplements({});
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

  function confirmBrownieCustomization() {
    const castanhas = selectedComplements["Castanhas"] || 0;
    const frutasVermelhas =
      selectedComplements["Frutas Vermelhas"] || 0;

    const customizationKey = `${customizingBrownie.id}-${castanhas}-${frutasVermelhas}`;

    const customizedPrice =
      customizingBrownie.price +
      castanhas * 2.5 +
      frutasVermelhas * 2.5;

    const customizations = {
      Castanhas: castanhas,
      "Frutas Vermelhas": frutasVermelhas,
    };

    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.customizationKey === customizationKey
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.customizationKey === customizationKey
            ? {
              ...item,
              quantity: item.quantity + 1,
            }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...customizingBrownie,
          id: `${customizingBrownie.id}-${Date.now()}`,
          baseProductId: customizingBrownie.id,
          customizationKey,
          customizations,
          price: customizedPrice,
          quantity: 1,
        },
      ];
    });

    setCustomizingBrownie(null);
    setSelectedComplements({});
    setCartOpen(true);
  }

  function addToCart(product) {

    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
              ...item,
              quantity: item.quantity + 1,
            }
            : item
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

    setCartOpen(true);
  }

  function increaseQuantity(productId, customizationKey) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId &&
          item.customizationKey === customizationKey
          ? {
            ...item,
            quantity: item.quantity + 1,
          }
          : item
      )
    );
  }

  function decreaseQuantity(productId, customizationKey) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId &&
            item.customizationKey === customizationKey
            ? {
              ...item,
              quantity: item.quantity - 1,
            }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  function formatPrice(value) {
    return value.toFixed(2).replace(".", ",");
  }

  const isMenuPage = window.location.pathname === "/cardapio";
  if (isMenuPage) {
    const categories = [
      {
        name: "Brownies",
        products: menuProducts.filter(
          (product) => product.category === "Brownies"
        ),
      },
      {
        name: "Tortas",
        products: menuProducts.filter(
          (product) => product.category === "Tortas"
        ),
      },
      {
        name: "Mousses",
        products: menuProducts.filter(
          (product) => product.category === "Mousses"
        ),
      },
      {
        name: "Clássicos",
        products: menuProducts.filter(
          (product) => product.category === "Clássicos"
        ),
      },
    ];

    return (
      <div className="app menu-page">

        <header className="header">

          <div className="brand">
            <img src={headerLogo} alt="Pé de Moça" />
            <img
              className="brand-writing"
              src={escrita}
              alt="Pé de Moça"
            />
          </div>
          <button
            className="header-cart"
            onClick={() => setCartOpen(true)}
          >
            <span className="cart-icon">
              🛒
            </span>

            <span className="cart-text">
              Carrinho
            </span>

            {totalItems > 0 && (
              <span className="cart-badge">
                {totalItems}
              </span>
            )}
          </button>

        </header>


        <main className="full-menu">

          <section className="menu-hero">

            <h1>
              Nosso cardápio
            </h1>

          </section>


          {categories.map((category) => (

            <section
              className={`menu-category category-${category.name.toLowerCase()}`}
              key={category.name}
            >

              <div className="menu-category-heading">
                <h2>
                  {category.name}
                </h2>
              </div>


              <div className="products-grid">

                {category.products.map((product) => (

                  <article
                    className="product-card"
                    key={product.id}
                  >

                    <div className="product-image">

                      <img
                        src={product.image}
                        alt={product.name}
                      />

                      <span className="product-tag">
                        {product.category}
                      </span>

                      <button
                        className="quick-add"
                        onClick={() =>
                          product.category === "Brownies"
                            ? openBrownieCustomization(product)
                            : addToCart(product)
                        }
                        aria-label={`Adicionar ${product.name}`}
                      >
                        +
                      </button>

                    </div>


                    <div className="product-content">

                      <div className="product-title">
                        <h3>{product.name}</h3>

                        <strong>
                          R$ {formatPrice(product.price)}
                        </strong>
                      </div>

                      <p>
                        {product.description}
                      </p>

                      <button
                        className="add-button"
                        onClick={() =>
                          product.category === "Brownies"
                            ? openBrownieCustomization(product)
                            : addToCart(product)
                        }
                      >
                        <span translate="no">
                          Adicionar ao pedido
                        </span>

                        <span translate="no">
                          +
                        </span>
                      </button>

                    </div>

                  </article>

                ))}

              </div>

            </section>

          ))}

        </main>

        <a
          href="/"
          className="menu-back-home"
        >
          ← Voltar para o início
        </a>

        <div className="menu-footer-brand">
          <div className="menu-footer-title">
            <strong>PÉ DE MOÇA</strong>
          </div>

          <div className="menu-footer-since">
            • DESDE 2026 •
          </div>
        </div>


        {/* ================= MODAL DO BROWNIE ================= */}

        {customizingBrownie && (
          <div
            className="brownie-overlay"
            onClick={() => setCustomizingBrownie(null)}
          >
            <div
              className="brownie-modal"
              onClick={(event) => event.stopPropagation()}
            >

              <button
                className="brownie-close"
                onClick={() => setCustomizingBrownie(null)}
                aria-label="Fechar"
              >
                ×
              </button>


              <span className="brownie-modal-label">
                PERSONALIZE SEU BROWNIE
              </span>


              <h2>
                {customizingBrownie.name}
              </h2>


              <p className="brownie-modal-description">
                Escolha o complemento que você quer adicionar.
              </p>


              <div className="brownie-options">

                <div className="brownie-option">
                  <div>
                    <div className="brownie-option-name">
                      <strong>Castanhas <b>+ R$ 2,50</b> </strong>
                    </div>

                    <span>Nozes, castanha e frutos secos</span>
                  </div>

                  <div className="complement-quantity">
                    <button
                      type="button"
                      disabled={!selectedComplements["Castanhas"]}
                      onClick={() =>
                        changeComplementQuantity("Castanhas", -1)
                      }
                    >
                      −
                    </button>

                    <span>
                      {selectedComplements["Castanhas"] || 0}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        changeComplementQuantity("Castanhas", 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="brownie-option">
                  <div>
                    <strong>Frutas Vermelhas <b>+ R$ 2,50</b> </strong>
                    <span>Morango, framboesa e amora</span>
                  </div>

                  <div className="complement-quantity">
                    <button
                      type="button"
                      disabled={!selectedComplements["Frutas Vermelhas"]}
                      onClick={() =>
                        changeComplementQuantity("Frutas Vermelhas", -1)
                      }
                    >
                      −
                    </button>

                    <span>
                      {selectedComplements["Frutas Vermelhas"] || 0}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        changeComplementQuantity("Frutas Vermelhas", 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>


              <div className="brownie-modal-total">

                <span>
                  Total do brownie
                </span>

                <strong>
                  R${" "}
                  {formatPrice(
                    customizingBrownie.price +
                    (selectedComplements["Castanhas"] || 0) * 2.5 +
                    (selectedComplements["Frutas Vermelhas"] || 0) * 2.5
                  )}
                </strong>

              </div>


              <button
                className="brownie-confirm"
                type="button"
                onClick={confirmBrownieCustomization}
              >
                Continuar
              </button>

            </div>
          </div>
        )}


        {cartOpen && (

          <div
            className="cart-overlay"
            onClick={() => setCartOpen(false)}
          >

            <aside
              className="cart"
              onClick={(event) => event.stopPropagation()}
            >

              <div className="cart-header">

                <div>

                  <span>
                    SEU PEDIDO
                  </span>

                  <h2>
                    Carrinho
                  </h2>

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

                  <div className="empty-icon">
                    🛒
                  </div>

                  <h3>
                    Seu carrinho está vazio
                  </h3>

                  <p>
                    Escolha um docinho para começar.
                  </p>

                  <button
                    onClick={() => setCartOpen(false)}
                  >
                    Ver cardápio
                  </button>

                </div>

              ) : (

                <>

                  <div className="cart-items">

                    {cart.map((item) => (

                      <div
                        className="cart-item"
                        key={item.id}
                      >

                        <img
                          src={item.image}
                          alt={item.name}
                        />

                        <div className="cart-item-info">

                          <div className="cart-item-top">

                            <h3>
                              {item.name}
                            </h3>
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

                            <strong>
                              R${" "}
                              {formatPrice(
                                item.price * item.quantity
                              )}
                            </strong>

                          </div>


                          <div className="quantity">

                            <button
                              onClick={() =>
                                decreaseQuantity(item.id, item.customizationKey)
                              }
                            >
                              −
                            </button>

                            <span>
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                increaseQuantity(item.id, item.customizationKey)
                              }
                            >
                              +
                            </button>

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>


                  <div className="cart-footer">

                    <div className="cart-line">

                      <span>
                        Subtotal
                      </span>

                      <strong>
                        R${" "}
                        {formatPrice(totalPrice)}
                      </strong>

                    </div>


                    <div className="cart-line delivery-line">

                      <span>
                        Entrega
                      </span>

                      <span>
                        Calculada no próximo passo
                      </span>

                    </div>


                    <div className="cart-total">

                      <span>
                        Total
                      </span>

                      <strong>
                        R${" "}
                        {formatPrice(totalPrice)}
                      </strong>

                    </div>


                    <button
                      className="checkout-button"
                      onClick={() =>
                        alert(
                          "Próxima etapa: endereço e pagamento!"
                        )
                      }
                    >
                      <span>
                        Continuar pedido
                      </span>

                      <span>
                        →
                      </span>

                    </button>

                  </div>

                </>

              )}

            </aside>

          </div>

        )}

      </div>
    );
  }

  return (
    <div className="app">

      {/* ================= HEADER ================= */}

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
            <img
              src={headerLogo}
              alt="Pé de Moça"
            />

            <img
              className="brand-writing"
              src={escrita}
              alt="Pé de Moça"
            />
          </a>

        </div>

        <nav
          className={`navigation ${menuOpen ? "navigation-open" : ""
            }`}
        >
          <a
            href="#inicio"
            onClick={() => setMenuOpen(false)}
          >
            Início
          </a>

          <a
            href="#cardapio"
            onClick={() => setMenuOpen(false)}
          >
            Cardápio
          </a>

          <a
            href="#sobre"
            onClick={() => setMenuOpen(false)}
          >
            Sobre nós
          </a>
        </nav>

        <button
          className="header-cart"
          onClick={() => setCartOpen(true)}
        >
          <span className="cart-icon">
            🛒
          </span>

          <span className="cart-text">
            Carrinho
          </span>

          {totalItems > 0 && (
            <span className="cart-badge">
              {totalItems}
            </span>
          )}
        </button>

      </header>


      {/* ================= HERO ================= */}

      <main>

        <section
          className="hero"
          id="inicio"
        >



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
              Pequenos momentos ficam ainda melhores
              quando têm gosto de Pé de Moça.
            </p>

            <div className="hero-buttons">

              <a
                href="#cardapio"
                className="primary-button"
              >
                Ver cardápio
                <span>→</span>
              </a>

              <a
                href="#sobre"
                className="secondary-button"
              >
                Conheça a gente
              </a>

            </div>

          </div>


          <div className="hero-visual">

            <div className="hero-circle">

              <img
                src={logo}
                alt="Logo Pé de Moça"
              />

            </div>



          </div>

        </section>


        {/* ================= CATEGORIAS ================= */}

        <section className="categories-section">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                ESCOLHA SEU MOMENTO
              </span>

              <h2>
                O que vai adoçar seu dia?
              </h2>

            </div>

            <p>
              Tem doce para dividir.
              <br />
              Tem doce para não dividir também.
            </p>

          </div>


          <div className="category-grid">

            <button className="category-card category-red">
              <span className="category-icon">
                🍫
              </span>

              <strong>
                Chocolates
              </strong>

              <small>
                Ver opções →
              </small>
            </button>


            <button className="category-card category-blue">
              <span className="category-icon">
                🍌
              </span>

              <strong>
                Banoffees
              </strong>

              <small>
                Ver opções →
              </small>
            </button>


            <button className="category-card category-yellow">
              <span className="category-icon">
                🍰
              </span>

              <strong>
                Bolos
              </strong>

              <small>
                Ver opções →
              </small>
            </button>


            <button className="category-card category-pink">
              <span className="category-icon">
                🥧
              </span>

              <strong>
                Tortinhas
              </strong>

              <small>
                Ver opções →
              </small>
            </button>

          </div>

        </section>


        {/* ================= CARDÁPIO ================= */}

        <section
          className="menu-section"
          id="cardapio"
        >

          <div className="menu-title">

            <div>

              <span className="eyebrow">
                OS QUERIDINHOS
              </span>

              <h2>
                Mais pedidos
              </h2>

            </div>

            <a href="/cardapio" className="view-all">
              Ver cardápio completo →
            </a>

          </div>


          <div className="products-grid">

            {products.map((product) => (

              <article
                className="product-card"
                key={product.id}
              >

                <div className="product-image">

                  <img
                    src={product.image}
                    alt={product.name}
                  />

                  <span className="product-tag">
                    {product.category}
                  </span>

                  <button
                    className="quick-add"
                    onClick={() => addToCart(product)}
                    aria-label={`Adicionar ${product.name}`}
                  >
                    +
                  </button>

                </div>


                <div className="product-content">

                  <div className="product-title">

                    <h3>
                      {product.name}
                    </h3>

                    <strong>
                      R$ {formatPrice(product.price)}
                    </strong>

                  </div>

                  <p>
                    {product.description}
                  </p>

                  <button
                    className="add-button"
                    onClick={() => addToCart(product)}
                  >
                    <span translate="no">
                      Adicionar ao pedido
                    </span>
                    <span translate="no">
                      +
                    </span>
                  </button>

                </div>

              </article>

            ))}

          </div>

        </section>


        {/* ================= SOBRE ================= */}

        <section
          className="about-section"
          id="sobre"
        >

          <div className="about-logo">

            <img
              src={logo}
              alt="Pé de Moça"
            />

          </div>


          <div className="about-content">

            <span className="eyebrow">
              UMA HISTÓRIA QUE ESTÁ COMEÇANDO
            </span>

            <h2>
              Feito à mão.
              <br />
              <span>
                Pensado nos detalhes.
              </span>
            </h2>

            <p>
              A Pé de Moça nasceu para transformar
              doces em pequenos momentos especiais.
              Cada receita, cada detalhe e cada pedido
              carregam um pouco da nossa personalidade.
            </p>

            <p>
              Divertida, artesanal e sem medo
              de sair do comum.
            </p>

            <button
              className="about-button"
              onClick={() => setCartOpen(true)}
            >
              Quero um docinho →
            </button>

          </div>

        </section>


        {/* ================= FRASE FINAL ================= */}

        <section className="final-section">

          <span>
            PÉ DE MOÇA • DOCERIA ARTESANAL • SINCE 2026
          </span>

          <h2>
            A vida fica mais gostosa
            <br />
            com um pouquinho de doce.
          </h2>

        </section>

      </main>


      {/* ================= CARRINHO ================= */}

      {cartOpen && (

        <div
          className="cart-overlay"
          onClick={() => setCartOpen(false)}
        >

          <aside
            className="cart"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="cart-header">

              <div>

                <span>
                  SEU PEDIDO
                </span>

                <h2>
                  Carrinho
                </h2>

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

                <div className="empty-icon">
                  🛒
                </div>

                <h3>
                  Seu carrinho está vazio
                </h3>

                <p>
                  Escolha um docinho para começar.
                </p>

                <button
                  onClick={() => setCartOpen(false)}
                >
                  Ver cardápio
                </button>

              </div>

            ) : (

              <>

                <div className="cart-items">

                  {cart.map((item) => (

                    <div
                      className="cart-item"
                      key={item.id}
                    >

                      <img
                        src={item.image}
                        alt={item.name}
                      />


                      <div className="cart-item-info">

                        <div className="cart-item-top">

                          <h3>
                            {item.name}
                          </h3>

                          <strong>
                            R${" "}
                            {formatPrice(
                              item.price *
                              item.quantity
                            )}
                          </strong>

                        </div>


                        <div className="quantity">

                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item.id
                              )
                            }
                          >
                            −
                          </button>

                          <span>
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              increaseQuantity(
                                item.id
                              )
                            }
                          >
                            +
                          </button>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>


                <div className="cart-footer">

                  <div className="cart-line">

                    <span>
                      Subtotal
                    </span>

                    <strong>
                      R${" "}
                      {formatPrice(totalPrice)}
                    </strong>

                  </div>


                  <div className="cart-line delivery-line">

                    <span>
                      Entrega
                    </span>

                    <span>
                      Calculada no próximo passo
                    </span>

                  </div>


                  <div className="cart-total">

                    <span>
                      Total
                    </span>

                    <strong>
                      R${" "}
                      {formatPrice(totalPrice)}
                    </strong>

                  </div>


                  <button
                    className="checkout-button"
                    onClick={() =>
                      alert(
                        "Próxima etapa: endereço e pagamento!"
                      )
                    }
                  >
                    <span>
                      Continuar pedido
                    </span>

                    <span>
                      →
                    </span>

                  </button>

                </div>

              </>

            )}

          </aside>

        </div>

      )}

    </div>
  );
}

export default App;