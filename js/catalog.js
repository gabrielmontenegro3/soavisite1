const FREE_SHIPPING = 1500;
const SHIPPING_FEE = 32;
const CART_KEY = "soavi-cart";
const ORDER_KEY = "soavi-orders";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const singular = {
  aneis: "Anel",
  colares: "Colar",
  brincos: "Brincos",
  pulseiras: "Pulseira",
};

const products = [
  {
    id: "essenza",
    name: "Anel Essenza",
    category: "aneis",
    price: 1480,
    image: "joia/anel-essenza.jpg",
    material: "Ouro 18k",
    description: "Faixa fina e lisa, com polimento alto. Leve o bastante para usar sozinha ou empilhada.",
  },
  {
    id: "lumi",
    name: "Argolas Lumi",
    category: "brincos",
    price: 980,
    image: "joia/brinco-lumi.jpg",
    material: "Ouro 18k",
    description: "Par de argolas tubulares com fecho de clique. O diâmetro fica próximo ao lóbulo.",
  },
  {
    id: "serena",
    name: "Pulseira Serena",
    category: "pulseiras",
    price: 1120,
    image: "joia/pulseira-serena.jpg",
    material: "Ouro 18k",
    description: "Corrente de elos pequenos, fecho de mola e extensor com plaquinha. Ajuste fino no pulso.",
  },
  {
    id: "gota-cristal",
    name: "Pulseira Gota e Cristal",
    category: "pulseiras",
    price: 1280,
    image: "joia/joia1.jpg",
    material: "Prata 925 · zircônia",
    description:
      "Corrente veneziana ajustável, com fecho de correr e duas esferas. Os pingentes são uma gota lisa e um cristal navete cercado por um halo.",
  },
];

function findProduct(id) {
  return products.find((product) => product.id === id);
}

function shippingFor(subtotal) {
  return subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE;
}

function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (item) =>
        products.some((product) => product.id === item.id) &&
        Number.isInteger(item.qty) &&
        item.qty > 0 &&
        item.qty <= 9
    );
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function cartTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + findProduct(item.id).price * item.qty, 0);
  const shipping = shippingFor(subtotal);
  return { subtotal, shipping, total: subtotal + shipping };
}
