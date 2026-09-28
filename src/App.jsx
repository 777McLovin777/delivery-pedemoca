import { useState } from "react";
import "./App.css";

import logo from "./assets/logo.png";
import banoffe from "./assets/banoffe.jpeg";
import tiramisu from "./assets/tiramisu.jpeg";
import tortinha from "./assets/tortinha.jpeg";

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

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  function increaseQuantity(productId) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  }

  function decreaseQuantity(productId) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
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
              src={logo}
              alt="Doceria Pé de Moça"
            />
          </a>

        </div>

        <nav
          className={`navigation ${
            menuOpen ? "navigation-open" : ""
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
              <span>para pedir mais um.</span>
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

            <button className="view-all">
              Ver cardápio completo →
            </button>

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