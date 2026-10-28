import { useEffect, useRef, useState } from "react";

import "./App.css";
import { supabase } from "./lib/supabase";
import { neighborhoods } from "./data/neighborhoods";

import CheckoutModal from "./components/CheckoutModal";

import logo from "./assets/logo.png";
import escrita from "./assets/Escrita-optimized.webp";
import logonova from "./assets/logonova-optimized.webp";
import baixo from "./assets/baixo.png";

import banoffe from "./assets/banoffe.jpeg";
import tiramisu from "./assets/tiramisu.jpeg";
import tortinha from "./assets/tortinha.jpeg";

import carrinho from "./assets/carrinho.png";
import insta from "./assets/insta.png";
import whats from "./assets/whats.png";

import agua from "./assets/agua.webp";
import aguagas from "./assets/aguagas.webp";
import coca from "./assets/coca.webp";
import cocazero from "./assets/cocazero.webp";

import seta from "./assets/seta.png";

import foto1 from "./assets/1.jpeg";
import foto2 from "./assets/2.jpeg";
import foto3 from "./assets/3.jpeg";
import foto4 from "./assets/4.jpeg";
import foto5 from "./assets/5.jpeg";
import foto6 from "./assets/6.jpeg";
import foto7 from "./assets/7.jpeg";

// Brownie tradicional
import bsem from "./assets/bsem.png";
import baoleite from "./assets/baoleite.png";
import bbranco from "./assets/bbranco.png";
import bdoce from "./assets/bdoce.png";

// Brownie com frutas vermelhas
import bfruta from "./assets/bfruta-optimized.webp";
import bfaoleite from "./assets/bfaoleite-optimized.webp";
import bfbranco from "./assets/bfbranco-optimized.webp";
import bfdoce from "./assets/bfdoce-optimized.webp";

// Brownie com castanhas
import bnozes from "./assets/bnozes-optimized.webp";
import bnaoleite from "./assets/bnaoleite-optimized.webp";
import bnbranco from "./assets/bnbranco-optimized.webp";
import bndoce from "./assets/bndoce-optimized.webp";

// Pé de Moça Gourmet
import dpedemoca from "./assets/dpedemoca-optimized.webp";
import dpedemoca2 from "./assets/dpedemoca2-optimized.webp";
import dpedemoca3 from "./assets/dpedemoca3-optimized.webp";

// Mousse de Café
import mcafe from "./assets/mcafe-optimized.webp";
import mcafe2 from "./assets/mcafe2-optimized.webp";
import mcafe3 from "./assets/mcafe3-optimized.webp";

// Mousse de Oreo
import moreo from "./assets/moreo-optimized.webp";

// Cookies — Nutella
import cnutella from "./assets/cnutella.webp";
import cnutella2 from "./assets/cnutella2.webp";
import cnutella3 from "./assets/cnutella3.webp";
import cnutella4 from "./assets/cnutella4.webp";

// Cookies — Kinder Bueno
import ckinder from "./assets/ckinder.webp";
import ckinder2 from "./assets/ckinder2.webp";
import ckinder3 from "./assets/ckinder3.webp";

// Torta de Mateiga Escocesa
import TMEembalda from "./assets/TMEembalda.webp";
import TMEmetade from "./assets/TMEmetade.webp";
import TMElado from "./assets/TMElado.webp";

/* =======================================================
   IMAGENS PADRONIZADAS DOS CARROSSÉIS
======================================================= */

const carouselImages = import.meta.glob("./assets/carrossel/*-carousel.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

function getCarouselImage(originalImage) {
  const originalPath = originalImage.split("?")[0];
  const filename = originalPath.split("/").pop();
  const extensionIndex = filename.lastIndexOf(".");

  if (extensionIndex === -1) return originalImage;

  const basename = filename.slice(0, extensionIndex);

  const matchingPath = Object.keys(carouselImages).find((path) =>
    path.endsWith(`/${basename}-carousel.webp`),
  );

  return matchingPath ? carouselImages[matchingPath] : originalImage;
}

/* =========================================================
   PRODUTOS
========================================================= */
const products = [
  {
    id: 201,
    name: "Pé de Moça Gourmet no Pote",
    category: "Mais pedidos",
    description:
      "Nosso clássico Pé de Moça em uma versão gourmet para comer de colher.",
    price: 14.9,
    image: dpedemoca,
  },
  {
    id: 302,
    name: "Cookie Kinder Bueno",
    category: "Mais pedidos",
    description: "Cookie artesanal com Kinder Bueno.",
    price: 14.9, // Provisório
    image: ckinder,
  },
  {
    id: 108,
    name: "Brownie com Castanhas",
    category: "Mais pedidos",
    description: "Brownie artesanal de chocolate com castanhas.",
    price: 13.9,
    image: bnozes,
  },
  ,
];

const menuProducts = [
  // Cookie de Nutella
  {
    id: 301,
    name: "Cookie de Nutella",
    category: "Cookies",
    description: "Cookie artesanal com Nutella.",
    price: 14.9, // Valor provisório
    image: cnutella,
  },

  // Cookie Kinder Bueno
  {
    id: 302,
    name: "Cookie Kinder Bueno",
    category: "Cookies",
    description: "Cookie artesanal com Kinder Bueno.",
    price: 14.9, // Valor provisório
    image: ckinder,
  },

  // Torta Escocesa
  {
    id: 303,
    name: "Torta de Manteiga Escocesa do Pica-Pau",
    category: "Tortas",
    description: "Torta Escocesa artesanal.",
    price: 15.9, // Valor provisório
    image: TMEembalda,
  },
  {
    id: 102,
    name: "Brownie com Frutas Vermelhas",
    category: "Brownies",
    description: "Brownie artesanal de chocolate com frutas vermelhas.",
    price: 13.9,
    image: bfruta,
  },
  {
    id: 108,
    name: "Brownie com Castanhas",
    category: "Brownies",
    description: "Brownie artesanal de chocolate com castanhas.",
    price: 13.9,
    image: bnozes,
  },
  {
    id: 101,
    name: "Brownie",
    category: "Brownies",
    description:
      "Brownie artesanal de chocolate, macio por dentro e com aquela casquinha irresistível.",
    price: 12.9,
    image: bsem,
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
      image: dpedemoca,
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
  cookies: "Cookies",
  tortas: "Tortas",
  bebidas: "Bebidas",
};

const categoryOptions = [
  "Doces autorais",
  "Brownies",
  "Cookies",
  "Tortas",
  "Bebidas",
];

const menuCategories = ["Brownies", "Cookies", "Tortas"];

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

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutCustomer, setCheckoutCustomer] = useState({
    name: "",
    whatsapp: "",
  });

  function openCheckout() {
    if (accountUser) {
      const savedName = accountUser.user_metadata?.nome_completo || "";

      const savedPhone = accountUser.user_metadata?.telefone || "";

      setCheckoutCustomer((current) => ({
        name: current.name.trim() || savedName,
        whatsapp: current.whatsapp.trim() || savedPhone,
      }));
    }

    setCartOpen(false);
    setCheckoutOpen(true);
  }

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountView, setAccountView] = useState("welcome");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [loginErrors, setLoginErrors] = useState({});
  const [loginShake, setLoginShake] = useState(0);

  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState(null);

  const [registerErrors, setRegisterErrors] = useState({});
  const [registerShake, setRegisterShake] = useState(0);

  function validateRegisterField(field, form) {
    const value = form[field]?.trim() || "";

    switch (field) {
      case "name":
        return value ? "" : "Informe seu nome completo.";

      case "phone": {
        const digits = value.replace(/\D/g, "");

        const validDDD = /^[1-9][1-9]/.test(digits.slice(0, 2));
        const validMobile = digits.length === 11 && digits[2] === "9";

        return validDDD && validMobile
          ? ""
          : "Informe um celular válido com DDD (11 dígitos).";
      }

      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? ""
          : "Informe um e-mail válido.";

      case "password":
        return value.length >= 6
          ? ""
          : "A senha precisa ter pelo menos 6 caracteres.";

      case "confirmPassword":
        return value && value === form.password
          ? ""
          : "As senhas não coincidem.";

      default:
        return "";
    }
  }

  function validateRegisterForm(form) {
    const errors = {};

    for (const field of [
      "name",
      "phone",
      "email",
      "password",
      "confirmPassword",
    ]) {
      const error = validateRegisterField(field, form);

      if (error) errors[field] = error;
    }

    return errors;
  }

  /* =========================================================
   CADASTRO - MÁSCARA DE TELEFONE
========================================================= */

  function formatPhone(value) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (!digits) return "";

    if (digits.length <= 2) {
      return `(${digits}`;
    }

    if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function updateRegisterField(field, value) {
    const formattedValue = field === "phone" ? formatPhone(value) : value;

    const updated = {
      ...registerForm,
      [field]: formattedValue,
    };

    setRegisterForm(updated);

    setRegisterErrors((current) => {
      const next = { ...current };

      if (field === "password") {
        for (const key of ["password", "confirmPassword"]) {
          if (current[key]) {
            next[key] = validateRegisterField(key, updated);
          }
        }
      } else if (current[field]) {
        next[field] = validateRegisterField(field, updated);
      }

      return next;
    });
  }

  const [addressForm, setAddressForm] = useState({
    apelido: "Casa",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    referencia: "",
  });

  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);

  const [addressMessage, setAddressMessage] = useState(null);
  const [addressErrors, setAddressErrors] = useState({});
  const [addressShake, setAddressShake] = useState(0);

  // Exclusão de endereços
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [addressDeleting, setAddressDeleting] = useState(false);

  const [showAddressForm, setShowAddressForm] = useState(false);

  const [editingAddressId, setEditingAddressId] = useState(null);
  const [accountNeighborhoodOpen, setAccountNeighborhoodOpen] = useState(false);

  const filteredAccountNeighborhoods = neighborhoods.filter((neighborhood) =>
    neighborhood
      .toLocaleLowerCase("pt-BR")
      .includes(addressForm.bairro.toLocaleLowerCase("pt-BR")),
  );

  const [accountUser, setAccountUser] = useState(null);
  const [accountCheckingSession, setAccountCheckingSession] = useState(true);

  const [editingProfile, setEditingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });

  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  /* =========================================================
   MINHA CONTA - OCULTAR MENSAGENS DE SUCESSO
========================================================= */

  useEffect(() => {
    if (!profileMessage?.includes("sucesso!")) return;

    const timer = setTimeout(() => {
      setProfileMessage(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [profileMessage]);

  useEffect(() => {
    if (!addressMessage?.includes("sucesso!")) return;

    const timer = setTimeout(() => {
      setAddressMessage(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [addressMessage]);

  /* =========================================================
   MINHA CONTA - CARREGAR ENDEREÇOS SALVOS
========================================================= */

  useEffect(() => {
    if (!accountUser?.id) {
      setCustomerAddresses([]);
      return;
    }

    let active = true;

    async function loadCustomerAddresses() {
      const { data, error } = await supabase
        .from("enderecos_clientes")
        .select("*")
        .eq("cliente_id", accountUser.id)
        .order("criado_em", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Erro ao carregar endereços:", error);
        return;
      }

      setCustomerAddresses(data || []);
    }

    loadCustomerAddresses();

    return () => {
      active = false;
    };
  }, [accountUser?.id]);
  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      if (error && error.name !== "AuthSessionMissingError") {
        console.error("Erro ao verificar sessão:", error);
      }

      setAccountUser(data.user ?? null);
      setAccountCheckingSession(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      setAccountUser(session?.user ?? null);
      setAccountCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleRegister(event) {
    event.preventDefault();
    setAccountMessage(null);

    const errors = validateRegisterForm(registerForm);
    setRegisterErrors(errors);

    if (Object.keys(errors).length > 0) {
      setRegisterShake((current) => current + 1);
      return;
    }

    const name = registerForm.name.trim();
    const phone = registerForm.phone.replace(/\D/g, "");
    const email = registerForm.email.trim().toLowerCase();

    if (!name || !phone || !email) {
      setAccountMessage("Preencha todos os campos.");
      return;
    }

    if (phone.length !== 11 || !/^[1-9][1-9]9\d{8}$/.test(phone)) {
      setAccountMessage("Informe um celular válido com DDD (11 dígitos).");
      return;
    }

    if (registerForm.password.length < 6) {
      setAccountMessage("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setAccountMessage("As senhas não coincidem.");
      return;
    }

    setAccountLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: registerForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/minha-conta`,
          data: {
            nome_completo: name,
            telefone: phone,
          },
        },
      });

      if (error) throw error;

      setRegisterForm({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setAccountMessage(
        "Cadastro solicitado! Confira seu e-mail para confirmar sua conta.",
      );
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setAccountMessage(
        "Não foi possível concluir o cadastro. Verifique seus dados e tente novamente.",
      );
    } finally {
      setAccountLoading(false);
    }
  }

  /* =======================================================
     LOGIN DO CLIENTE
  ======================================================= */

  async function handleLogin(event) {
    event.preventDefault();

    setAccountMessage(null);

    const errors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email.trim())) {
      errors.email = "Informe um e-mail válido.";
    }

    if (!loginForm.password.trim()) {
      errors.password = "Informe sua senha.";
    }

    setLoginErrors(errors);

    if (Object.keys(errors).length > 0) {
      setLoginShake((current) => current + 1);
      return;
    }

    setAccountLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password,
      });

      if (error) {
        throw error;
      }

      setLoginForm({
        email: "",
        password: "",
      });

      setAccountMessage("Login realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao entrar:", error);

      setAccountMessage("Não foi possível entrar. Confira seu e-mail, senha.");
    } finally {
      setAccountLoading(false);
    }
  }

  /* =========================================================
     MINHA CONTA - ENDEREÇO PRINCIPAL
  ========================================================= */

  async function handleSetPrimaryAddress(addressId) {
    if (!accountUser?.id || !addressId) return;

    setAddressMessage(null);

    const selectedAddress = customerAddresses.find(
      (address) => address.id === addressId,
    );

    if (!selectedAddress) return;

    const isAlreadyPrimary = selectedAddress.principal;

    try {
      const { error } = await supabase.rpc(
        isAlreadyPrimary
          ? "desmarcar_endereco_principal"
          : "definir_endereco_principal",
        {
          p_endereco_id: addressId,
        },
      );

      if (error) throw error;

      setCustomerAddresses((current) =>
        current.map((address) => ({
          ...address,
          principal: isAlreadyPrimary ? false : address.id === addressId,
        })),
      );

      setAddressMessage(
        isAlreadyPrimary
          ? "Endereço principal desmarcado com sucesso!"
          : "Endereço principal atualizado com sucesso!",
      );
    } catch (error) {
      console.error("Erro ao atualizar endereço principal:", error);

      setAddressMessage(
        "Não foi possível atualizar o endereço principal. Tente novamente.",
      );
    }
  }

  /* =========================================================
     MINHA CONTA - EXCLUIR/SALVAR/EDITAR ENDEREÇO
  ========================================================= */

  async function handleDeleteAddress() {
    if (!addressToDelete?.id || !accountUser?.id || addressDeleting) return;

    setAddressDeleting(true);
    setAddressMessage(null);

    try {
      const { data, error } = await supabase
        .from("enderecos_clientes")
        .delete()
        .eq("id", addressToDelete.id)
        .eq("cliente_id", accountUser.id)
        .select("id");

      if (error) throw error;

      if (!data?.length) {
        throw new Error("Endereço não encontrado ou exclusão não autorizada.");
      }

      setCustomerAddresses((current) =>
        current.filter((address) => address.id !== addressToDelete.id),
      );

      if (editingAddressId === addressToDelete.id) {
        setEditingAddressId(null);
        setShowAddressForm(false);
      }

      setAddressToDelete(null);
      setAddressMessage("Endereço excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir endereço:", error);
      setAddressMessage(
        "Não foi possível excluir o endereço. Tente novamente.",
      );
      setAddressToDelete(null);
    } finally {
      setAddressDeleting(false);
    }
  }

  /* =========================================================
   MINHA CONTA - EDITAR DADOS PESSOAIS
========================================================= */

  function handleOpenProfileEdit() {
    setProfileForm({
      name: accountUser?.user_metadata?.nome_completo || "",
      phone: formatPhone(accountUser?.user_metadata?.telefone || ""),
    });

    setProfileErrors({});
    setProfileMessage(null);
    setEditingProfile(true);
  }

  function handleCancelProfileEdit() {
    setEditingProfile(false);
    setProfileErrors({});
    setProfileMessage(null);
  }

  /* =========================================================
   MINHA CONTA - SALVAR DADOS PESSOAIS
========================================================= */

  async function handleSaveProfile(event) {
    event.preventDefault();

    if (!accountUser?.id || profileLoading) return;

    setProfileMessage(null);

    const name = profileForm.name.trim().replace(/\s+/g, " ");
    const phone = profileForm.phone.replace(/\D/g, "");

    const errors = {};

    if (name.length < 2) {
      errors.name = "Informe um nome com pelo menos 2 caracteres.";
    }

    if (!/^[1-9][1-9]9\d{8}$/.test(phone)) {
      errors.phone = "Informe um celular válido com DDD.";
    }

    setProfileErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setProfileLoading(true);

    try {
      // Atualiza os dados no Supabase Auth.
      const { data: authData, error: authError } =
        await supabase.auth.updateUser({
          data: {
            nome_completo: name,
            telefone: phone,
          },
        });

      if (authError) throw authError;

      // Atualiza também a tabela de perfis.
      const { error: profileError } = await supabase
        .from("perfis_clientes")
        .upsert(
          {
            id: accountUser.id,
            nome_completo: name,
            telefone: phone,
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: "id" },
        );

      if (profileError) throw profileError;

      setAccountUser(authData.user);

      setEditingProfile(false);
      setProfileErrors({});
      setProfileMessage("Dados atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar dados pessoais:", error);

      setProfileMessage(
        "Não foi possível concluir a atualização. Tente novamente.",
      );
    } finally {
      setProfileLoading(false);
    }
  }

  function handleEditAddress(address) {
    setEditingAddressId(address.id);

    setAddressForm({
      apelido: address.apelido || "Casa",
      cep: address.cep || "",
      rua: address.rua || "",
      numero: address.numero || "",
      complemento: address.complemento || "",
      bairro: address.bairro || "",
      cidade: address.cidade || "",
      estado: address.estado || "",
      referencia: address.referencia || "",
    });

    setAddressMessage(null);
    setAccountNeighborhoodOpen(false);
    setShowAddressForm(true);
  }

  async function handleSaveAddress(event) {
    event.preventDefault();
    setAddressMessage(null);

    if (!accountUser?.id) {
      setAddressMessage("Entre na sua conta para salvar um endereço.");
      return;
    }

    const errors = {};

    if (!addressForm.rua.trim()) {
      errors.rua = "Informe a rua ou avenida.";
    }

    if (!addressForm.numero.trim()) {
      errors.numero = "Informe o número ou marque S/N.";
    }

    if (!neighborhoods.includes(addressForm.bairro.trim())) {
      errors.bairro = "Selecione um bairro atendido pela Pé de Moça.";
    }

    setAddressErrors(errors);

    if (Object.keys(errors).length > 0) {
      setAddressShake((current) => current + 1);
      return;
    }

    setAddressLoading(true);

    try {
      const addressData = {
        apelido: addressForm.apelido.trim() || "Casa",
        rua: addressForm.rua.trim(),
        numero: addressForm.numero.trim(),
        complemento: addressForm.complemento.trim() || null,
        bairro: addressForm.bairro.trim(),
        referencia: addressForm.referencia.trim() || null,
      };

      let query;

      if (editingAddressId) {
        // EDITAR: atualiza o endereço existente
        query = supabase
          .from("enderecos_clientes")
          .update(addressData)
          .eq("id", editingAddressId)
          .eq("cliente_id", accountUser.id);
      } else {
        // ADICIONAR: cria um novo endereço
        query = supabase.from("enderecos_clientes").insert({
          ...addressData,
          cliente_id: accountUser.id,
          principal: false,
        });
      }

      const { data, error } = await query.select().single();

      if (error) throw error;

      setCustomerAddresses((current) =>
        editingAddressId
          ? current.map((address) =>
              address.id === editingAddressId ? data : address,
            )
          : [...current, data],
      );

      const wasEditing = Boolean(editingAddressId);

      setEditingAddressId(null);
      setShowAddressForm(false);
      setAddressForm({
        apelido: "Casa",
        cep: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        referencia: "",
      });

      setAddressMessage(
        wasEditing
          ? "Endereço atualizado com sucesso!"
          : "Endereço salvo com sucesso!",
      );
    } catch (error) {
      console.error("Erro ao salvar endereço:", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      });

      setAddressMessage("Não foi possível salvar o endereço. Tente novamente.");
    } finally {
      setAddressLoading(false);
    }
  }

  useEffect(() => {
    let lastScrollY = window.scrollY;

    function handleScroll() {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY) {
        setMenuOpen(false);
      }

      lastScrollY = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const [customizingProduct, setCustomizingProduct] = useState(null);

  const [selectedComplements, setSelectedComplements] = useState({});

  const [productQuantity, setProductQuantity] = useState(1);

  const [productObservation, setProductObservation] = useState("");

  const [carouselIndex, setCarouselIndex] = useState(0);

  const [loyaltyPanel, setLoyaltyPanel] = useState(null);

  const [loyaltyOrderNumber, setLoyaltyOrderNumber] = useState("");

  const [loyaltyPhone, setLoyaltyPhone] = useState("");

  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  const [loyaltyMessage, setLoyaltyMessage] = useState(null);

  const [loyaltyProgress, setLoyaltyProgress] = useState(0);

  const [loyaltyRewardUnlocked, setLoyaltyRewardUnlocked] = useState(false);

  const [loyaltyAvailableRewards, setLoyaltyAvailableRewards] = useState(0);

  const carouselTouchStartX = useRef(null);

  /* =======================================================
   CRIAR PERFIL INICIAL DO CLIENTE
======================================================= */

  useEffect(() => {
    if (!accountUser?.id) return;

    let active = true;

    async function createCustomerProfile() {
      const metadata = accountUser.user_metadata || {};
      const name = metadata.nome_completo?.trim();

      if (!name) return;

      const { error } = await supabase.from("perfis_clientes").upsert(
        {
          id: accountUser.id,
          nome_completo: name,
          telefone: metadata.telefone || null,
        },
        {
          onConflict: "id",
          ignoreDuplicates: true,
        },
      );

      if (error && active) {
        console.error("Erro ao criar perfil inicial:", error);
      }
    }

    createCustomerProfile();

    return () => {
      active = false;
    };
  }, [accountUser?.id]);

  /* =======================================================
     LOCAL STORAGE
  ======================================================= */

  useEffect(() => {
    localStorage.setItem("pedemoca-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const savedPhone = localStorage.getItem("pedemoca-loyalty-phone");
    const savedOrderNumber = localStorage.getItem("pedemoca-loyalty-order");

    if (!savedPhone || !savedOrderNumber) {
      return;
    }

    const orderNumber = Number(savedOrderNumber);

    if (!Number.isSafeInteger(orderNumber) || orderNumber <= 0) {
      localStorage.removeItem("pedemoca-loyalty-order");
      return;
    }

    let cancelled = false;

    async function loadLoyaltyStatus() {
      try {
        const { data, error } = await supabase.functions.invoke(
          "validar-fidelidade",
          {
            body: {
              action: "status",
              orderNumber,
              phone: savedPhone,
            },
          },
        );

        if (error) {
          throw error;
        }

        if (!data?.success || cancelled) {
          return;
        }

        setLoyaltyPhone(savedPhone);
        setLoyaltyProgress(data.card_progress ?? 0);
        setLoyaltyAvailableRewards(data.available_rewards ?? 0);
        setLoyaltyRewardUnlocked(false);
      } catch (error) {
        console.error("Erro ao carregar cartão fidelidade:", error);
      }
    }

    loadLoyaltyStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
   TRAVA O SCROLL DA PÁGINA COM O MODAL ABERTO
======================================================= */

  useEffect(() => {
    if (!customizingProduct) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [customizingProduct]);

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
    setProductObservation("");

    // Sempre abre o carrossel na primeira foto
    setCarouselIndex(0);
  }

  function closeProductCustomization() {
    setCustomizingProduct(null);
    setSelectedComplements({});
    setProductQuantity(1);
    setProductObservation("");
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

    const isBrownie =
      customizingProduct.category === "Brownies" ||
      [101, 102, 108].includes(customizingProduct.id);

    const caldaChocolateAoLeite =
      selectedComplements["Calda de chocolate ao leite"] || 0;

    const caldaChocolateBranco =
      selectedComplements["Calda de chocolate branco"] || 0;

    const caldaDoceDeLeite = selectedComplements["Calda de doce de leite"] || 0;

    const complementPrice =
      caldaChocolateAoLeite * 2.5 +
      caldaChocolateBranco * 2.5 +
      caldaDoceDeLeite * 2.5;

    const unitPrice =
      customizingProduct.price + (isBrownie ? complementPrice : 0);

    const observation = productObservation.trim();

    const customizations = isBrownie
      ? {
          "Calda de chocolate ao leite": caldaChocolateAoLeite,
          "Calda de chocolate branco": caldaChocolateBranco,
          "Calda de doce de leite": caldaDoceDeLeite,
        }
      : null;
    setCart((currentCart) => {
      if (!isBrownie) {
        const existingProduct = currentCart.find(
          (item) =>
            item.id === customizingProduct.id &&
            !item.customizationKey &&
            (item.observation || "") === observation,
        );

        if (existingProduct) {
          return currentCart.map((item) =>
            item.id === customizingProduct.id &&
            !item.customizationKey &&
            (item.observation || "") === observation
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
            id: observation
              ? `${customizingProduct.id}-${Date.now()}`
              : customizingProduct.id,
            baseProductId: customizingProduct.id,
            observation,
            quantity: productQuantity,
          },
        ];
      }

      const customizationKey = [
        customizingProduct.id,
        caldaChocolateAoLeite,
        caldaChocolateBranco,
        caldaDoceDeLeite,
        observation,
      ].join("-");

      const existingProduct = currentCart.find(
        (item) =>
          item.customizationKey === customizationKey &&
          (item.observation || "") === observation,
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.customizationKey === customizationKey &&
          (item.observation || "") === observation
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
          observation,
          price: unitPrice,
          quantity: productQuantity,
        },
      ];
    });

    closeProductCustomization();
    openCart();
  }

  /* =======================================================
     PROGRAMA DE FIDELIDADE
  ======================================================= */

  async function handleLoyaltyValidation() {
    const orderNumber = Number(loyaltyOrderNumber);
    const phone = loyaltyPhone.trim();

    if (!Number.isSafeInteger(orderNumber) || orderNumber <= 0 || !phone) {
      setLoyaltyMessage({
        type: "error",
        text: "Informe o número do pedido e o telefone.",
      });

      return;
    }

    setLoyaltyLoading(true);
    setLoyaltyMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "validar-fidelidade",
        {
          body: {
            orderNumber,
            phone,
          },
        },
      );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        if (data?.code === "STAMP_ALREADY_GRANTED") {
          const { data: statusData, error: statusError } =
            await supabase.functions.invoke("validar-fidelidade", {
              body: {
                action: "status",
                orderNumber,
                phone,
              },
            });

          if (!statusError && statusData?.success) {
            localStorage.setItem("pedemoca-loyalty-phone", phone);
            localStorage.setItem("pedemoca-loyalty-order", String(orderNumber));

            setLoyaltyProgress(statusData.card_progress ?? 0);
            setLoyaltyAvailableRewards(statusData.available_rewards ?? 0);
            setLoyaltyRewardUnlocked(false);
          }
        }

        setLoyaltyMessage({
          type: "error",
          text: data?.message || "Não foi possível validar este pedido.",
        });

        return;
      }

      localStorage.setItem("pedemoca-loyalty-phone", phone);
      localStorage.setItem("pedemoca-loyalty-order", String(orderNumber));

      const { data: statusData, error: statusError } =
        await supabase.functions.invoke("validar-fidelidade", {
          body: {
            action: "status",
            orderNumber,
            phone,
          },
        });

      setLoyaltyProgress(data.card_progress ?? 0);
      setLoyaltyRewardUnlocked(Boolean(data.reward_unlocked));

      if (!statusError && statusData?.success) {
        setLoyaltyAvailableRewards(statusData.available_rewards ?? 0);
      }

      setLoyaltyMessage({
        type: "success",
        text: data.message || "Carimbo adicionado com sucesso!",
      });

      setLoyaltyOrderNumber("");
    } catch (error) {
      console.error("Erro ao validar fidelidade:", error);

      setLoyaltyMessage({
        type: "error",
        text: "Não foi possível validar o pedido agora. Tente novamente.",
      });
    } finally {
      setLoyaltyLoading(false);
    }
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

  const isAccountPage = currentPath === "/minha-conta";

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
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />

          <span className="product-tag">{product.category}</span>

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

              <button
                onClick={() => {
                  setCartOpen(false);
                  window.location.href = "/cardapio";
                }}
              >
                <span>Ver cardápio</span>
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                    />

                    <div className="cart-item-info">
                      <div className="cart-item-top">
                        <div>
                          <h3>{item.name}</h3>

                          {item.customizations && (
                            <div className="cart-customizations">
                              {item.customizations[
                                "Calda de chocolate ao leite"
                              ] > 0 && (
                                <span>
                                  Calda de chocolate ao leite ×{" "}
                                  {
                                    item.customizations[
                                      "Calda de chocolate ao leite"
                                    ]
                                  }
                                </span>
                              )}

                              {item.customizations[
                                "Calda de chocolate branco"
                              ] > 0 && (
                                <span>
                                  Calda de chocolate branco ×{" "}
                                  {
                                    item.customizations[
                                      "Calda de chocolate branco"
                                    ]
                                  }
                                </span>
                              )}

                              {item.customizations["Calda de doce de leite"] >
                                0 && (
                                <span>
                                  Calda de doce de leite ×{" "}
                                  {
                                    item.customizations[
                                      "Calda de doce de leite"
                                    ]
                                  }
                                </span>
                              )}
                            </div>
                          )}
                          {item.observation && (
                            <div className="cart-observation">
                              <strong>Observação:</strong>
                              <span>{item.observation}</span>
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

                <div className="cart-actions">
                  <button
                    type="button"
                    className="add-more-button"
                    onClick={() => setCartOpen(false)}
                  >
                    <span>←</span>
                    <span>Adicionar mais itens</span>
                  </button>

                  <button
                    type="button"
                    className="checkout-button"
                    onClick={openCheckout}
                  >
                    <span>Finalizar pedido</span>
                    <span>→</span>
                  </button>
                </div>
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
    if (!customizingProduct) {
      return null;
    }

    const isBrownie =
      customizingProduct.category === "Brownies" ||
      [101, 102, 108].includes(customizingProduct.id);

    let productImages;

    if (customizingProduct.id === 102) {
      // Brownie com Frutas Vermelhas
      productImages = [bfruta, bfaoleite, bfbranco, bfdoce];
    } else if (customizingProduct.id === 108) {
      // Brownie com Castanhas
      productImages = [bnozes, bnaoleite, bnbranco, bndoce];
    } else if (customizingProduct.id === 101) {
      // Brownie tradicional
      productImages = [bsem, baoleite, bbranco, bdoce];
    } else if (customizingProduct.id === 201) {
      // Pé de Moça Gourmet no Pote
      productImages = [dpedemoca, dpedemoca2, dpedemoca3];
    } else if (customizingProduct.id === 106) {
      // Mousse de Café
      productImages = [mcafe, mcafe2, mcafe3];
    } else if (customizingProduct.id === 301) {
      // Cookie de Nutella — 4 fotos
      productImages = [cnutella, cnutella2, cnutella3, cnutella4];
    } else if (customizingProduct.id === 302) {
      // Cookie Kinder Bueno — 3 fotos
      productImages = [ckinder, ckinder2, ckinder3];
    } else if (customizingProduct.id === 303) {
      // Torta de Manteiga Escocesa — 3 fotos
      productImages = [TMEembalda, TMEmetade, TMElado];
    } else {
      // Demais produtos continuam usando o carrossel atual
      productImages = [customizingProduct.image, foto1, foto2, foto4];
    }

    // Utiliza as versões padronizadas apenas no carrossel
    productImages = productImages.map(getCarouselImage);

    function previousImage() {
      setCarouselIndex((current) =>
        current === 0 ? productImages.length - 1 : current - 1,
      );
    }
    function nextImage() {
      setCarouselIndex((current) =>
        current === productImages.length - 1 ? 0 : current + 1,
      );
    }

    function selectImage(index) {
      setCarouselIndex(index);
    }
    function handleCarouselTouchStart(event) {
      carouselTouchStartX.current = event.touches[0].clientX;
    }

    function handleCarouselTouchEnd(event) {
      if (carouselTouchStartX.current === null) {
        return;
      }

      const touchEndX = event.changedTouches[0].clientX;
      const distance = touchEndX - carouselTouchStartX.current;

      carouselTouchStartX.current = null;

      // Ignora movimentos muito pequenos
      if (Math.abs(distance) < 40) {
        return;
      }

      // Arrastou para esquerda → próxima foto
      if (distance < 0) {
        nextImage();
        return;
      }

      // Arrastou para direita → foto anterior
      previousImage();
    }

    const caldaChocolateAoLeite =
      selectedComplements["Calda de chocolate ao leite"] || 0;

    const caldaChocolateBranco =
      selectedComplements["Calda de chocolate branco"] || 0;

    const caldaDoceDeLeite = selectedComplements["Calda de doce de leite"] || 0;

    const complementsTotal =
      caldaChocolateAoLeite * 2.5 +
      caldaChocolateBranco * 2.5 +
      caldaDoceDeLeite * 2.5;

    const unitPrice =
      customizingProduct.price + (isBrownie ? complementsTotal : 0);

    const totalPrice = unitPrice * productQuantity;

    return (
      <div className="brownie-overlay" onClick={closeProductCustomization}>
        <div
          className="brownie-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="brownie-close-layer">
            <button
              className="brownie-close"
              onClick={closeProductCustomization}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>

          {/* =====================================================
    MODAL DE PRODUTO — CARROSSEL DE IMAGENS
===================================================== */}

          {/* =====================================================
    MODAL DE PRODUTO — CARROSSEL DE IMAGENS
===================================================== */}

          <div
            className="product-modal-carousel"
            onTouchStart={handleCarouselTouchStart}
            onTouchEnd={handleCarouselTouchEnd}
          >
            {/* FOTOS EMPILHADAS */}
            <div className="product-modal-carousel-track">
              {productImages.map((image, index) => (
                <div
                  className={`product-modal-slide ${
                    index === carouselIndex ? "active" : ""
                  }`}
                  key={`${customizingProduct.id}-${index}`}
                >
                  <img
                    src={image}
                    alt={`${customizingProduct.name} - foto ${index + 1}`}
                    draggable="false"
                    className={
                      customizingProduct.id === 201
                        ? "pe-de-moca-carousel-image"
                        : ""
                    }
                  />
                </div>
              ))}
            </div>

            {/* SETA ESQUERDA */}
            <button
              type="button"
              className="carousel-arrow carousel-arrow-left"
              onClick={(event) => {
                event.stopPropagation();
                previousImage();
              }}
              aria-label="Foto anterior"
            >
              ‹
            </button>

            {/* SETA DIREITA */}
            <button
              type="button"
              className="carousel-arrow carousel-arrow-right"
              onClick={(event) => {
                event.stopPropagation();
                nextImage();
              }}
              aria-label="Próxima foto"
            >
              ›
            </button>

            {/* INDICADORES */}
            <div className="product-modal-dots">
              {productImages.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  className={`product-modal-dot ${
                    index === carouselIndex ? "active" : ""
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectImage(index);
                  }}
                  aria-label={`Ir para foto ${index + 1}`}
                />
              ))}
            </div>
          </div>

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
                      Calda de chocolate ao leite <b>+ R$ 2,50</b>
                    </strong>
                  </div>

                  <span>Chocolate ao leite cremoso</span>
                </div>

                <div className="complement-quantity">
                  <button
                    type="button"
                    disabled={!caldaChocolateAoLeite}
                    onClick={() =>
                      changeComplementQuantity(
                        "Calda de chocolate ao leite",
                        -1,
                      )
                    }
                  >
                    −
                  </button>

                  <span>{caldaChocolateAoLeite}</span>

                  <button
                    type="button"
                    onClick={() =>
                      changeComplementQuantity("Calda de chocolate ao leite", 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="brownie-option">
                <div>
                  <div className="brownie-option-name">
                    <strong>
                      Calda de chocolate branco <b>+ R$ 2,50</b>
                    </strong>
                  </div>

                  <span>Chocolate branco cremoso</span>
                </div>

                <div className="complement-quantity">
                  <button
                    type="button"
                    disabled={!caldaChocolateBranco}
                    onClick={() =>
                      changeComplementQuantity("Calda de chocolate branco", -1)
                    }
                  >
                    −
                  </button>

                  <span>{caldaChocolateBranco}</span>

                  <button
                    type="button"
                    onClick={() =>
                      changeComplementQuantity("Calda de chocolate branco", 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="brownie-option">
                <div>
                  <div className="brownie-option-name">
                    <strong>
                      Calda de doce de leite <b>+ R$ 2,50</b>
                    </strong>
                  </div>

                  <span>Doce de leite cremoso</span>
                </div>

                <div className="complement-quantity">
                  <button
                    type="button"
                    disabled={!caldaDoceDeLeite}
                    onClick={() =>
                      changeComplementQuantity("Calda de doce de leite", -1)
                    }
                  >
                    −
                  </button>

                  <span>{caldaDoceDeLeite}</span>

                  <button
                    type="button"
                    onClick={() =>
                      changeComplementQuantity("Calda de doce de leite", 1)
                    }
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
                onClick={() => changeProductQuantity(-1)}
              >
                −
              </button>

              <span>{productQuantity}</span>

              <button type="button" onClick={() => changeProductQuantity(1)}>
                +
              </button>
            </div>
          </div>

          <div className="product-observation-heading">
            <div className="product-observation-title">
              <label htmlFor={`product-observation-${customizingProduct.id}`}>
                Observações
              </label>

              <span>Opcional</span>
            </div>

            <strong
              className={`product-observation-counter ${
                productObservation.length >= 150 ? "limit-reached" : ""
              }`}
            >
              {productObservation.length}/150
            </strong>
          </div>
          <textarea
            id={`product-observation-${customizingProduct.id}`}
            style={{
              width: "100%",
              height: "75px",
              minHeight: "75px",
              maxHeight: "75px",
              padding: "10px 10px",
              resize: "none",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
            value={productObservation}
            onChange={(event) => setProductObservation(event.target.value)}
            onKeyDown={(event) => {
              const allowedKeys = [
                "Backspace",
                "Delete",
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "Tab",
                "Home",
                "End",
              ];

              if (
                productObservation.length >= 150 &&
                !allowedKeys.includes(event.key) &&
                !event.ctrlKey &&
                !event.metaKey
              ) {
                const counter = document.querySelector(
                  ".product-observation-counter",
                );

                if (counter) {
                  counter.classList.remove("limit-shake");

                  void counter.offsetWidth;

                  counter.classList.add("limit-shake");
                }
              }
            }}
            onAnimationEnd={(event) => {
              event.currentTarget.classList.remove("observation-limit-bump");
            }}
            placeholder="Alguma observação sobre este produto?"
            maxLength={150}
            rows={3}
          />

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
            <img src={insta} alt="Instagram" loading="lazy" decoding="async" />

            <span>@docepedemoca</span>
          </a>

          <a
            href="https://wa.me/5511910513097"
            target="_blank"
            rel="noopener noreferrer"
            className="social-item"
          >
            <img src={whats} alt="WhatsApp" loading="lazy" decoding="async" />

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
        <div className="header-left">
          <button
            type="button"
            className="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            ☰
          </button>

          <a href="/" className="brand">
            <img className="brand-writing" src={escrita} alt="Pé de Moça" />
          </a>
        </div>

        <nav className={`navigation ${menuOpen ? "navigation-open" : ""}`}>
          <a href="/" onClick={() => setMenuOpen(false)}>
            Início
          </a>

          <a href="/cardapio" onClick={() => setMenuOpen(false)}>
            Cardápio
          </a>

          <a href="/minha-conta" onClick={() => setMenuOpen(false)}>
            Minha conta
          </a>
        </nav>

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

  /* =======================================================
   PÁGINA: MINHA CONTA
======================================================= */

  if (isAccountPage) {
    return (
      <div className="app account-page">
        <MenuHeader />

        <main className="account-main">
          <div className="account-heading">
            <span>Pé de Moça</span>
            <h1>Minha conta</h1>
          </div>

          {accountCheckingSession && <p>Carregando sua conta...</p>}

          {!accountCheckingSession && accountUser && (
            <div className="account-profile-card">
              <h2>
                Olá,{" "}
                {accountUser.user_metadata?.nome_completo
                  ?.trim()
                  .split(/\s+/)[0] || "cliente"}
                !
              </h2>

              <p>Que bom ter você de volta à Pé de Moça.</p>

              <p>
                <strong>E-mail:</strong> {accountUser.email}
              </p>

              {!editingProfile && (
                <button
                  type="button"
                  className="account-profile-edit-button"
                  onClick={handleOpenProfileEdit}
                >
                  <span aria-hidden="true">✎</span>
                  Editar meus dados
                </button>
              )}

              {profileMessage && (
                <p className="account-address-message" role="status">
                  {profileMessage}
                </p>
              )}

              {editingProfile && (
                <form
                  className="account-form account-profile-edit-form"
                  onSubmit={handleSaveProfile}
                  noValidate
                >
                  <h3>Editar meus dados</h3>

                  <div className="account-profile-divider" aria-hidden="true" />

                  <div className="account-field">
                    <label htmlFor="profile-name">Nome</label>

                    <input
                      id="profile-name"
                      type="text"
                      autoComplete="name"
                      value={profileForm.name}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />

                    {profileErrors.name && (
                      <small className="account-field-error">
                        {profileErrors.name}
                      </small>
                    )}
                  </div>

                  <div className="account-field">
                    <label htmlFor="profile-phone">Celular</label>

                    <input
                      id="profile-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={15}
                      value={profileForm.phone}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          phone: formatPhone(event.target.value),
                        }))
                      }
                    />

                    {profileErrors.phone && (
                      <small className="account-field-error">
                        {profileErrors.phone}
                      </small>
                    )}
                  </div>

                  <div className="account-profile-divider" aria-hidden="true" />

                  <button type="submit" disabled={profileLoading}>
                    {profileLoading ? "Salvando..." : "Salvar alterações"}
                  </button>

                  <button
                    type="button"
                    className="account-back account-cancel-button"
                    onClick={handleCancelProfileEdit}
                  >
                    Cancelar
                  </button>
                </form>
              )}

              <div className="account-address-section">
                <h2>Meus endereços</h2>

                <p>
                  Cadastre um endereço para facilitar seus próximos pedidos.
                </p>

                {customerAddresses.map((address) => (
                  <div className="account-address-card" key={address.id}>
                    <div className="account-address-card-header">
                      <strong>{address.apelido || "Meu endereço"}</strong>

                      <button
                        type="button"
                        className="account-address-edit"
                        onClick={() => handleSetPrimaryAddress(address.id)}
                        aria-label={
                          address.principal
                            ? "Endereço principal"
                            : "Definir como endereço principal"
                        }
                        title={
                          address.principal
                            ? "Endereço principal"
                            : "Definir como principal"
                        }
                        aria-pressed={Boolean(address.principal)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={address.principal ? "var(--red)" : "none"}
                          stroke="var(--red)"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polygon points="12 2 15.1 8.3 22 9.3 17 14.2 18.2 21 12 17.8 5.8 21 7 14.2 2 9.3 8.9 8.3 12 2" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="account-address-edit"
                        onClick={() => handleEditAddress(address)}
                        aria-label={`Editar endereço ${address.apelido || "Meu endereço"}`}
                        title="Editar endereço"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="account-address-delete"
                        onClick={() => setAddressToDelete(address)}
                        aria-label={`Excluir endereço ${address.apelido || "Meu endereço"}`}
                        title="Excluir endereço"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 10v7" />
                          <path d="M14 10v7" />
                        </svg>
                      </button>
                    </div>

                    <p>
                      {address.rua}, {address.numero}
                    </p>

                    <p>
                      {address.bairro}
                      {address.cidade ? ` - ${address.cidade}` : ""}
                      {address.estado ? `/${address.estado}` : ""}
                    </p>

                    {address.complemento?.trim() && (
                      <p>
                        <strong>Complemento:</strong> {address.complemento}
                      </p>
                    )}

                    {address.referencia?.trim() && (
                      <p>
                        <strong>Referência:</strong> {address.referencia}
                      </p>
                    )}
                  </div>
                ))}

                {addressToDelete && (
                  <div
                    className="account-delete-overlay"
                    onClick={() => {
                      if (!addressDeleting) setAddressToDelete(null);
                    }}
                  >
                    <div
                      className="account-delete-modal"
                      role="alertdialog"
                      aria-modal="true"
                      aria-labelledby="account-delete-title"
                      aria-describedby="account-delete-description"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="account-delete-icon">
                        <svg
                          width="25"
                          height="25"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 10v7" />
                          <path d="M14 10v7" />
                        </svg>
                      </div>

                      <h3 id="account-delete-title">Excluir endereço?</h3>

                      <p id="account-delete-description">
                        Tem certeza de que deseja excluir o endereço{" "}
                        <strong>
                          {addressToDelete.apelido || "Meu endereço"}
                        </strong>
                        ? Essa ação não poderá ser desfeita.
                      </p>

                      <div className="account-delete-actions">
                        <button
                          type="button"
                          className="account-delete-cancel"
                          disabled={addressDeleting}
                          onClick={() => setAddressToDelete(null)}
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          className="account-delete-confirm"
                          disabled={addressDeleting}
                          onClick={handleDeleteAddress}
                        >
                          {addressDeleting ? "Excluindo..." : "Excluir"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!showAddressForm && addressMessage && (
                  <p className="account-address-message" role="status">
                    {addressMessage}
                  </p>
                )}

                {!showAddressForm && (
                  <button
                    type="button"
                    className="account-address-add"
                    onClick={() => {
                      setAddressMessage(null);
                      setAddressErrors({});
                      setEditingAddressId(null);
                      setAccountNeighborhoodOpen(false);

                      setAddressForm({
                        apelido: "Casa",
                        cep: "",
                        rua: "",
                        numero: "",
                        complemento: "",
                        bairro: "",
                        cidade: "",
                        estado: "",
                        referencia: "",
                      });

                      setShowAddressForm(true);
                    }}
                  >
                    Adicionar endereço
                  </button>
                )}

                {showAddressForm && (
                  <form
                    className="account-form account-address-form"
                    onSubmit={handleSaveAddress}
                    noValidate
                  >
                    {[
                      [
                        "apelido",
                        "Apelido do endereço",
                        "text",
                        false,
                        "Ex.: Casa, Trabalho...",
                      ],
                      ["rua", "Rua", "text", true, "Nome da rua ou avenida"],
                      ["numero", "Número", "text", true, "Ex.: 123"],
                      [
                        "complemento",
                        "Complemento",
                        "text",
                        false,
                        "Apto, bloco, casa dos fundos...",
                      ],
                      ["bairro", "Bairro", "text", true, ""],
                      [
                        "referencia",
                        "Ponto de referência",
                        "text",
                        false,
                        "Ex.: próximo ao mercado",
                      ],
                    ].map(([field, label, type, required, placeholder]) => (
                      <div className="account-address-field" key={field}>
                        <label htmlFor={`address-${field}`}>{label}</label>

                        {field === "bairro" ? (
                          <div
                            className="checkout-neighborhood-wrapper"
                            onBlur={(event) => {
                              if (
                                !event.currentTarget.contains(
                                  event.relatedTarget,
                                )
                              ) {
                                setAccountNeighborhoodOpen(false);
                              }
                            }}
                          >
                            <input
                              key={`bairro-${addressErrors.bairro ? addressShake : "ok"}`}
                              id="address-bairro"
                              name="bairro"
                              type="text"
                              className={`checkout-neighborhood-input ${
                                addressErrors.bairro
                                  ? "account-input-shake account-input-error"
                                  : ""
                              }`}
                              aria-invalid={Boolean(addressErrors.bairro)}
                              autoComplete="off"
                              placeholder="Digite ou selecione seu bairro"
                              value={addressForm.bairro}
                              onFocus={() => setAccountNeighborhoodOpen(true)}
                              onChange={(event) => {
                                setAddressForm((current) => ({
                                  ...current,
                                  bairro: event.target.value,
                                }));
                                setAccountNeighborhoodOpen(true);
                              }}
                              aria-expanded={accountNeighborhoodOpen}
                              aria-controls="account-neighborhood-options"
                              required
                            />

                            <button
                              type="button"
                              className="checkout-neighborhood-toggle"
                              aria-label="Mostrar bairros"
                              aria-expanded={accountNeighborhoodOpen}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() =>
                                setAccountNeighborhoodOpen(
                                  (current) => !current,
                                )
                              }
                            >
                              {accountNeighborhoodOpen ? "▲" : "▼"}
                            </button>

                            {accountNeighborhoodOpen && (
                              <div
                                id="account-neighborhood-options"
                                className="checkout-neighborhood-dropdown"
                              >
                                {filteredAccountNeighborhoods.length > 0 ? (
                                  filteredAccountNeighborhoods.map(
                                    (neighborhood) => (
                                      <button
                                        key={neighborhood}
                                        type="button"
                                        className="checkout-neighborhood-option"
                                        onMouseDown={(event) =>
                                          event.preventDefault()
                                        }
                                        onClick={() => {
                                          setAddressForm((current) => ({
                                            ...current,
                                            bairro: neighborhood,
                                          }));
                                          setAccountNeighborhoodOpen(false);
                                        }}
                                      >
                                        {neighborhood}
                                      </button>
                                    ),
                                  )
                                ) : (
                                  <div className="checkout-neighborhood-empty">
                                    Bairro não encontrado
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <input
                            key={`${field}-${addressErrors[field] ? addressShake : "ok"}`}
                            id={`address-${field}`}
                            type={type}
                            placeholder={placeholder}
                            className={
                              addressErrors[field]
                                ? "account-input-shake account-input-error"
                                : ""
                            }
                            aria-invalid={Boolean(addressErrors[field])}
                            value={addressForm[field]}
                            onChange={(event) =>
                              setAddressForm((current) => ({
                                ...current,
                                [field]: event.target.value,
                              }))
                            }
                            required={required}
                            maxLength={
                              field === "cep"
                                ? 9
                                : field === "estado"
                                  ? 2
                                  : undefined
                            }
                            inputMode={
                              field === "numero" && addressForm.numero !== "S/N"
                                ? "numeric"
                                : undefined
                            }
                            disabled={
                              field === "numero" && addressForm.numero === "S/N"
                            }
                          />
                        )}

                        {field === "numero" && (
                          <label className="account-address-no-number">
                            <input
                              type="checkbox"
                              checked={addressForm.numero === "S/N"}
                              onChange={(event) => {
                                setAddressForm((current) => ({
                                  ...current,
                                  numero: event.target.checked ? "S/N" : "",
                                }));
                              }}
                            />
                            <span>S/N</span>
                          </label>
                        )}

                        {addressErrors[field] && (
                          <span className="account-field-error" role="alert">
                            <span aria-hidden="true">!</span>
                            {addressErrors[field]}
                          </span>
                        )}
                      </div>
                    ))}

                    {addressMessage && (
                      <p className="account-address-message">
                        {addressMessage}
                      </p>
                    )}

                    <button type="submit" disabled={addressLoading}>
                      {addressLoading ? "Salvando..." : "Salvar endereço"}
                    </button>

                    <button
                      type="button"
                      className="account-back account-cancel-button"
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddressId(null);
                        setAddressMessage(null);
                        setAddressErrors({});
                        setAccountNeighborhoodOpen(false);

                        setAddressForm({
                          apelido: "Casa",
                          cep: "",
                          rua: "",
                          numero: "",
                          complemento: "",
                          bairro: "",
                          cidade: "",
                          estado: "",
                          referencia: "",
                        });
                      }}
                    >
                      Cancelar
                    </button>
                  </form>
                )}
              </div>

              {!showAddressForm && (
                <div className="account-actions">
                  <button
                    type="button"
                    className="account-return-button"
                    onClick={() => {
                      window.location.href = "/";
                    }}
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const { error } = await supabase.auth.signOut();

                      if (error) {
                        setAccountMessage("Não foi possível sair da conta.");
                        return;
                      }

                      setCustomerAddresses([]);
                      setShowAddressForm(false);
                      setAccountMessage(null);
                      setAccountView("welcome");
                    }}
                  >
                    Sair da conta
                  </button>
                </div>
              )}
            </div>
          )}

          <div
            className="account-content"
            style={
              accountUser || accountCheckingSession
                ? { display: "none" }
                : undefined
            }
          >
            {!accountCheckingSession &&
              !accountUser &&
              accountView === "welcome" && (
                <>
                  <h2 className="account-centered-title">
                    Que bom ter você por aqui!
                  </h2>

                  <p>
                    Entre na sua conta ou faça seu cadastro para aproveitar uma
                    experiência ainda mais doce.
                  </p>

                  <div className="account-actions">
                    <button
                      type="button"
                      onClick={() => setAccountView("login")}
                    >
                      Entrar
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountView("register")}
                    >
                      Criar conta
                    </button>
                  </div>
                </>
              )}

            {!accountUser && accountView === "login" && (
              <>
                <h2 className="account-centered-title">
                  Entrar na minha conta
                </h2>
                <p>Que bom ter você de volta!</p>

                <form
                  className="account-form"
                  onSubmit={handleLogin}
                  noValidate
                >
                  <div className="account-register-field">
                    <label htmlFor="login-email">E-mail</label>

                    <input
                      key={`login-email-${loginErrors.email ? loginShake : "ok"}`}
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="Digite seu e-mail"
                      className={loginErrors.email ? "account-input-shake" : ""}
                      aria-invalid={Boolean(loginErrors.email)}
                      aria-describedby={
                        loginErrors.email ? "login-email-error" : undefined
                      }
                      value={loginForm.email}
                      onChange={(event) => {
                        const value = event.target.value;

                        setLoginForm((current) => ({
                          ...current,
                          email: value,
                        }));

                        setLoginErrors((current) => ({
                          ...current,
                          email: "",
                        }));
                      }}
                    />

                    {loginErrors.email && (
                      <span
                        id="login-email-error"
                        className="account-field-error"
                        role="alert"
                      >
                        <span aria-hidden="true">!</span>
                        {loginErrors.email}
                      </span>
                    )}
                  </div>

                  <div className="account-register-field">
                    <label htmlFor="login-password">Senha</label>

                    <input
                      key={`login-password-${loginErrors.password ? loginShake : "ok"}`}
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Digite sua senha"
                      className={
                        loginErrors.password ? "account-input-shake" : ""
                      }
                      aria-invalid={Boolean(loginErrors.password)}
                      aria-describedby={
                        loginErrors.password
                          ? "login-password-error"
                          : undefined
                      }
                      value={loginForm.password}
                      onChange={(event) => {
                        const value = event.target.value;

                        setLoginForm((current) => ({
                          ...current,
                          password: value,
                        }));

                        setLoginErrors((current) => ({
                          ...current,
                          password: "",
                        }));
                      }}
                    />

                    {loginErrors.password && (
                      <span
                        id="login-password-error"
                        className="account-field-error"
                        role="alert"
                      >
                        <span aria-hidden="true">!</span>
                        {loginErrors.password}
                      </span>
                    )}
                  </div>

                  {accountMessage && (
                    <div className="account-login-alert" role="alert">
                      <span
                        className="account-login-alert-icon"
                        aria-hidden="true"
                      >
                        !
                      </span>

                      <span>{accountMessage}</span>
                    </div>
                  )}

                  <button type="submit" disabled={accountLoading}>
                    {accountLoading ? "Entrando..." : "Entrar"}
                  </button>
                </form>

                <button
                  type="button"
                  className="account-back"
                  onClick={() => {
                    setAccountMessage(null);
                    setAccountView("welcome");
                  }}
                >
                  Voltar
                </button>
              </>
            )}

            {!accountUser && accountView === "register" && (
              <>
                <h2 className="account-register-title">Criar minha conta</h2>
                <p>Preencha seus dados para fazer parte da Pé de Moça.</p>

                <form
                  className="account-form"
                  onSubmit={handleRegister}
                  noValidate
                >
                  {[
                    {
                      field: "name",
                      label: "Nome completo",
                      type: "text",
                      auto: "name",
                      placeholder: "Digite seu nome completo",
                    },
                    {
                      field: "phone",
                      label: "Telefone",
                      type: "tel",
                      auto: "tel",
                      placeholder: "(11) 99999-9999",
                    },
                    {
                      field: "email",
                      label: "E-mail",
                      type: "email",
                      auto: "email",
                      placeholder: "exemplo@email.com",
                    },
                    {
                      field: "password",
                      label: "Senha",
                      type: "password",
                      auto: "new-password",
                      placeholder: "Mínimo de 6 caracteres",
                    },
                    {
                      field: "confirmPassword",
                      label: "Confirmar senha",
                      type: "password",
                      auto: "new-password",
                      placeholder: "Digite sua senha novamente",
                    },
                  ].map(({ field, label, type, auto, placeholder }) => (
                    <div className="account-register-field" key={field}>
                      <label htmlFor={`register-${field}`}>{label}</label>

                      <input
                        key={`${field}-${registerErrors[field] ? registerShake : "ok"}`}
                        className={
                          registerErrors[field] ? "account-input-shake" : ""
                        }
                        id={`register-${field}`}
                        type={type}
                        autoComplete={auto}
                        placeholder={placeholder}
                        inputMode={field === "phone" ? "numeric" : undefined}
                        maxLength={field === "phone" ? 15 : undefined}
                        value={registerForm[field]}
                        onChange={(event) =>
                          updateRegisterField(field, event.target.value)
                        }
                        aria-invalid={Boolean(registerErrors[field])}
                        aria-describedby={
                          registerErrors[field]
                            ? `register-${field}-error`
                            : undefined
                        }
                      />

                      {registerErrors[field] && (
                        <span
                          id={`register-${field}-error`}
                          className="account-field-error"
                          role="alert"
                        >
                          <span aria-hidden="true">!</span>
                          {registerErrors[field]}
                        </span>
                      )}
                    </div>
                  ))}

                  {accountMessage && (
                    <div
                      className={`account-login-alert ${
                        accountMessage.startsWith("Cadastro solicitado!")
                          ? "account-alert-success"
                          : "account-alert-error"
                      }`}
                      role="status"
                    >
                      <span
                        className="account-login-alert-icon"
                        aria-hidden="true"
                      >
                        {accountMessage.startsWith("Cadastro solicitado!")
                          ? "✓"
                          : "!"}
                      </span>
                      <span>{accountMessage}</span>
                    </div>
                  )}

                  <button type="submit" disabled={accountLoading}>
                    {accountLoading ? "Criando conta..." : "Criar conta"}
                  </button>
                </form>

                <button
                  type="button"
                  className="account-back"
                  onClick={() => setAccountView("welcome")}
                >
                  Voltar
                </button>
              </>
            )}
          </div>
        </main>

        <CartDrawer />

        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          customer={checkoutCustomer}
          onCustomerChange={setCheckoutCustomer}
          savedAddresses={accountUser ? customerAddresses : []}
          customerEmail={accountUser?.email || ""}
          subtotal={totalPrice}
          cart={cart}
          onOrderSuccess={clearCart}
        />
      </div>
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
        {ProductModal()}
        <CartDrawer />
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          customer={checkoutCustomer}
          onCustomerChange={setCheckoutCustomer}
          savedAddresses={accountUser ? customerAddresses : []}
          customerEmail={accountUser?.email || ""}
          subtotal={totalPrice}
          cart={cart}
          onOrderSuccess={clearCart}
        />
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

          <section className="menu-category-page">
            <div className="products-grid">
              {[
                newCategoryProducts["Doces autorais"][0],
                menuProducts.find((product) => product.id === 108),
                menuProducts.find((product) => product.id === 302),
                menuProducts.find((product) => product.id === 303),
                newCategoryProducts.Bebidas[0], // Água sem gás
                newCategoryProducts.Bebidas[2], // Coca-Cola
              ]
                .filter(Boolean)
                .map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </section>
        </main>

        <a href="/" className="menu-back-home">
          ← Voltar para o início
        </a>

        <div className="menu-footer-brand">
          <img
            src={baixo}
            alt="Pé de Moça"
            className="menu-footer-image"
            loading="lazy"
            decoding="async"
          />
        </div>
        <SocialSection />

        <ScrollTopButton />
        {ProductModal()}
        <CartDrawer />
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          customer={checkoutCustomer}
          onCustomerChange={setCheckoutCustomer}
          savedAddresses={accountUser ? customerAddresses : []}
          customerEmail={accountUser?.email || ""}
          subtotal={totalPrice}
          cart={cart}
          onOrderSuccess={clearCart}
        />
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
          <a href="/minha-conta" onClick={() => setMenuOpen(false)}>
            Minha conta
          </a>

          <a href="/cardapio" onClick={() => setMenuOpen(false)}>
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
            PROGRAMA DE FIDELIDADE
        ================================================= */}

        <section className="loyalty-section">
          <div className="loyalty-card">
            <div className="loyalty-content">
              <span className="loyalty-eyebrow">PROGRAMA DE FIDELIDADE</span>

              <h2>
                Seu carinho por doce
                <br />
                merece <span>recompensa.</span>
              </h2>

              <div className="loyalty-progress">
                <span>Seu cartão</span>

                <strong>
                  {loyaltyRewardUnlocked ? 8 : loyaltyProgress} de 8 carimbos
                </strong>
              </div>

              {loyaltyAvailableRewards > 0 && (
                <div className="loyalty-reward-available" role="status">
                  <span className="loyalty-reward-icon" aria-hidden="true">
                    🎁
                  </span>

                  <div>
                    <strong>
                      {loyaltyAvailableRewards === 1
                        ? "Você tem 1 recompensa disponível!"
                        : `Você tem ${loyaltyAvailableRewards} recompensas disponíveis!`}
                    </strong>

                    <small>
                      Sua recompensa conquistada está esperando por você.
                    </small>
                  </div>
                </div>
              )}

              <div className="loyalty-stamps">
                {Array.from({ length: 8 }, (_, index) => {
                  const stampNumber = index + 1;

                  const isFilled =
                    loyaltyRewardUnlocked || stampNumber <= loyaltyProgress;

                  return (
                    <div
                      className={`loyalty-stamp ${
                        index === 7 ? "loyalty-stamp-reward" : ""
                      } ${isFilled ? "loyalty-stamp-filled" : ""}`}
                      key={`loyalty-stamp-${stampNumber}`}
                    >
                      <span>{stampNumber}</span>

                      <small>
                        {index === 7
                          ? loyaltyRewardUnlocked
                            ? "LIBERADA"
                            : "RECOMPENSA"
                          : isFilled
                            ? "CARIMBADO"
                            : "CARIMBO"}
                      </small>
                    </div>
                  );
                })}
              </div>

              <div className="loyalty-actions">
                <button
                  type="button"
                  className="loyalty-rules-button"
                  onClick={() => setLoyaltyPanel("rules")}
                >
                  Ver regras
                </button>

                <button
                  type="button"
                  className="loyalty-stamp-button"
                  onClick={() => setLoyaltyPanel("stamp")}
                >
                  Pegar carimbo
                </button>
              </div>
            </div>

            {loyaltyPanel === "rules" && (
              <div className="loyalty-card-panel">
                <div className="loyalty-card-panel-content">
                  <span className="loyalty-eyebrow">
                    PROGRAMA DE FIDELIDADE
                  </span>

                  <h2>
                    Como <span>funciona?</span>
                  </h2>

                  <p className="loyalty-panel-description">
                    É simples: pediu, carimbou. Complete seu cartão e
                    desbloqueie sua recompensa.
                  </p>

                  <div className="loyalty-rules-list">
                    <div className="loyalty-rule">
                      <strong>01</strong>
                      <p>
                        Cada pedido concluído vale <b>1 carimbo</b>.
                      </p>
                    </div>

                    <div className="loyalty-rule">
                      <strong>02</strong>
                      <p>
                        Os carimbos são por pedido, não pela quantidade de
                        produtos.
                      </p>
                    </div>

                    <div className="loyalty-rule">
                      <strong>03</strong>
                      <p>
                        Complete os <b>8 carimbos</b> para liberar sua
                        recompensa.
                      </p>
                    </div>

                    <div className="loyalty-rule">
                      <strong>04</strong>
                      <p>
                        O carimbo será liberado após a{" "}
                        <b>confirmação de recebimento</b> do pedido.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="loyalty-back-button"
                    onClick={() => setLoyaltyPanel(null)}
                  >
                    ← Voltar ao cartão fidelidade
                  </button>
                </div>
              </div>
            )}

            {loyaltyPanel === "stamp" && (
              <div className="loyalty-card-panel">
                <div className="loyalty-card-panel-content">
                  <span className="loyalty-eyebrow">SEU CARIMBO</span>

                  <h2>
                    Como pegar meu <span>carimbo?</span>
                  </h2>

                  <p className="loyalty-panel-description">
                    Seu carimbo está ligado a um pedido válido realizado na Pé
                    de Moça.
                  </p>

                  <div className="loyalty-stamp-info">
                    <strong>1 pedido válido = 1 carimbo</strong>

                    <p>
                      Após confirmar o recebimento, informe o número do pedido
                      para validar seu carimbo.
                    </p>

                    <div className="loyalty-order-validation">
                      <label htmlFor="loyalty-order-number">
                        Número do pedido
                      </label>

                      <div className="loyalty-order-field">
                        <input
                          id="loyalty-order-number"
                          type="text"
                          inputMode="numeric"
                          placeholder="Ex.: 1024"
                          autoComplete="off"
                          value={loyaltyOrderNumber}
                          onChange={(event) => {
                            setLoyaltyOrderNumber(
                              event.target.value.replace(/\D/g, ""),
                            );
                            setLoyaltyMessage(null);
                          }}
                        />
                      </div>

                      <label htmlFor="loyalty-phone">
                        Telefone usado no pedido
                      </label>

                      <div className="loyalty-order-field">
                        <input
                          id="loyalty-phone"
                          type="tel"
                          inputMode="tel"
                          placeholder="Ex.: (11) 99999-9999"
                          autoComplete="tel"
                          value={loyaltyPhone}
                          onChange={(event) => {
                            setLoyaltyPhone(event.target.value);
                            setLoyaltyMessage(null);
                          }}
                        />

                        <button
                          type="button"
                          onClick={handleLoyaltyValidation}
                          disabled={loyaltyLoading}
                        >
                          {loyaltyLoading ? "Validando..." : "Validar pedido"}
                        </button>
                      </div>

                      {loyaltyMessage && (
                        <p
                          className={`loyalty-validation-message ${loyaltyMessage.type}`}
                          role="status"
                        >
                          {loyaltyMessage.text}
                        </p>
                      )}
                    </div>

                    <small>
                      Cada número de pedido poderá gerar apenas um carimbo.
                      Pedidos cancelados ou reembolsados não são elegíveis.
                    </small>
                  </div>

                  <button
                    type="button"
                    className="loyalty-back-button"
                    onClick={() => setLoyaltyPanel(null)}
                  >
                    ← Voltar ao cartão fidelidade
                  </button>
                </div>
              </div>
            )}
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
            <img
              src={logonova}
              alt="Pé de Moça"
              loading="lazy"
              decoding="async"
            />
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
      {ProductModal()}
      <CartDrawer />
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        customer={checkoutCustomer}
        onCustomerChange={setCheckoutCustomer}
        savedAddresses={accountUser ? customerAddresses : []}
        customerEmail={accountUser?.email || ""}
        subtotal={totalPrice}
        cart={cart}
        onOrderSuccess={clearCart}
      />
    </div>
  );
}

export default App;
