const payEmpty = document.querySelector("#pay-empty");
const payFlow = document.querySelector("#pay-flow");
const payDone = document.querySelector("#pay-done");
const payForm = document.querySelector("#pay-form");
const payError = document.querySelector("#pay-error");
const cardFields = document.querySelector("#card-fields");
const paySubmit = document.querySelector("#pay-submit");
const summary = document.querySelector("#pay-summary");

let cart = readCart();
let paying = false;

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function showError(message) {
  payError.hidden = !message;
  payError.textContent = message || "";
}

function method() {
  return new FormData(payForm).get("metodo");
}

function syncMethod() {
  const card = method() === "cartao";
  cardFields.hidden = !card;
  cardFields.querySelectorAll("input").forEach((input) => {
    input.required = card;
  });
  updatePayLabel();
}

function updatePayLabel() {
  if (paying) return;
  const { total } = cartTotals(cart);
  const label = method() === "pix" ? "Pagar com Pix" : "Pagar com cartão";
  paySubmit.textContent = `${label} · ${money.format(total)}`;
}

function renderSummary() {
  const { subtotal, shipping, total } = cartTotals(cart);
  summary.replaceChildren();
  summary.append(el("h2", null, "Seu pedido"));

  cart.forEach((item) => {
    const product = findProduct(item.id);
    const row = el("article", "summary__line");
    const photo = document.createElement("img");
    photo.src = product.image;
    photo.alt = "";
    const info = el("div");
    info.append(
      el("strong", null, product.name),
      el("p", null, `${item.qty} × ${money.format(product.price)}`)
    );
    row.append(photo, info, el("p", null, money.format(product.price * item.qty)));
    summary.append(row);
  });

  const totals = el("dl", "totals");
  totals.append(
    totalRow("Subtotal", money.format(subtotal)),
    totalRow("Frete", shipping === 0 ? "Grátis" : money.format(shipping)),
    totalRow("Total", money.format(total), true)
  );
  summary.append(totals);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function totalRow(label, value, emphasize) {
  const row = el("div", emphasize ? "is-total" : "");
  row.append(el("dt", null, label), el("dd", null, value));
  return row;
}

function readOrders() {
  try {
    const raw = JSON.parse(localStorage.getItem(ORDER_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function showReceipt(order) {
  payEmpty.hidden = true;
  payFlow.hidden = true;
  payDone.hidden = false;
  document.querySelector("#done-id").textContent = `Pedido ${order.id}`;
  document.querySelector("#done-method").textContent =
    order.payment.method === "pix"
      ? "Pix confirmado. Enviaremos a nota para o e-mail informado."
      : `${order.payment.brand} final ${order.payment.last4}. Enviaremos a nota para o e-mail informado.`;

  const address = order.address;
  const extra = address.complemento ? `, ${address.complemento}` : "";
  document.querySelector("#done-address").textContent =
    `Entrega em ${address.rua}, ${address.numero}${extra} — ${address.bairro}, ${address.cidade}/${address.estado}, ${address.cep}.`;

  const items = document.querySelector("#done-items");
  items.replaceChildren();
  order.items.forEach((item) => {
    const product = findProduct(item.id);
    const row = el("p", "done__item", `${item.qty}× ${product ? product.name : item.id} — ${money.format(item.price * item.qty)}`);
    items.append(row);
  });

  const totals = document.querySelector("#done-totals");
  totals.replaceChildren(
    totalRow("Subtotal", money.format(order.subtotal)),
    totalRow("Frete", order.shipping === 0 ? "Grátis" : money.format(order.shipping)),
    totalRow("Total pago", money.format(order.total), true)
  );
  document.title = `Pedido ${order.id} — Soavi Joalheria`;
}

function showCheckout() {
  if (cart.length === 0) {
    payEmpty.hidden = false;
    payFlow.hidden = true;
    payDone.hidden = true;
    return;
  }
  payEmpty.hidden = true;
  payFlow.hidden = false;
  payDone.hidden = true;
  renderSummary();
  syncMethod();
}

function cardBrand(number) {
  if (number.startsWith("4")) return "Visa";
  if (number.startsWith("5")) return "Mastercard";
  if (number.startsWith("3")) return "American Express";
  return "Cartão";
}

function validate(data) {
  const nome = String(data.get("nome") || "").trim();
  const email = String(data.get("email") || "").trim();
  const telefone = digits(data.get("telefone"));
  const cep = digits(data.get("cep"));
  const cidade = String(data.get("cidade") || "").trim();
  const rua = String(data.get("rua") || "").trim();
  const numero = String(data.get("numero") || "").trim();
  const bairro = String(data.get("bairro") || "").trim();

  if (nome.length < 3) return "Informe seu nome completo.";
  if (!email.includes("@") || !email.includes(".")) return "Informe um e-mail válido.";
  if (telefone.length < 10 || telefone.length > 11) return "Informe um telefone com DDD.";
  if (cep.length !== 8) return "Informe um CEP com 8 dígitos.";
  if (cidade.length < 2 || rua.length < 3 || !numero || bairro.length < 2) {
    return "Complete o endereço de entrega.";
  }

  if (data.get("metodo") === "cartao") {
    const cartao = digits(data.get("cartao"));
    const titular = String(data.get("titular") || "").trim();
    const validade = String(data.get("validade") || "").trim();
    const cvv = digits(data.get("cvv"));
    const match = /^(\d{2})\/(\d{2})$/.exec(validade);
    if (cartao.length < 15 || cartao.length > 16) return "Confira o número do cartão.";
    if (titular.length < 3) return "Informe o nome impresso no cartão.";
    if (!match) return "Informe a validade no formato MM/AA.";
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const now = new Date();
    const expired = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
    if (month < 1 || month > 12 || expired) return "Este cartão está vencido.";
    if (cvv.length < 3 || cvv.length > 4) return "Confira o código de segurança.";
  }

  return "";
}

payForm.addEventListener("change", (event) => {
  if (event.target.name === "metodo") syncMethod();
});

payForm.querySelector("input[name='cartao']").addEventListener("input", (event) => {
  const value = digits(event.target.value).slice(0, 16);
  event.target.value = value.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
});

payForm.querySelector("input[name='validade']").addEventListener("input", (event) => {
  const value = digits(event.target.value).slice(0, 4);
  event.target.value = value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value;
});

payForm.querySelector("input[name='cep']").addEventListener("input", (event) => {
  const value = digits(event.target.value).slice(0, 8);
  event.target.value = value.length > 5 ? `${value.slice(0, 5)}-${value.slice(5)}` : value;
});

payForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (paying || cart.length === 0) return;

  const data = new FormData(payForm);
  const error = validate(data);
  if (error) {
    showError(error);
    return;
  }

  showError("");
  paying = true;
  paySubmit.disabled = true;
  paySubmit.textContent = "Processando pagamento...";

  const totals = cartTotals(cart);
  const cardNumber = digits(data.get("cartao"));
  const order = {
    id: `SV-${String(Date.now()).slice(-6)}`,
    createdAt: new Date().toISOString(),
    status: "pago",
    customer: {
      nome: String(data.get("nome") || "").trim(),
      email: String(data.get("email") || "").trim(),
      telefone: digits(data.get("telefone")),
    },
    address: {
      cep: payForm.querySelector("input[name='cep']").value,
      estado: String(data.get("estado") || ""),
      cidade: String(data.get("cidade") || "").trim(),
      rua: String(data.get("rua") || "").trim(),
      numero: String(data.get("numero") || "").trim(),
      complemento: String(data.get("complemento") || "").trim(),
      bairro: String(data.get("bairro") || "").trim(),
    },
    payment:
      data.get("metodo") === "pix"
        ? { method: "pix" }
        : { method: "cartao", brand: cardBrand(cardNumber), last4: cardNumber.slice(-4) },
    items: cart.map((item) => ({
      id: item.id,
      qty: item.qty,
      price: findProduct(item.id).price,
    })),
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    total: totals.total,
  };

  window.setTimeout(() => {
    const orders = readOrders();
    orders.push(order);
    localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
    cart = [];
    writeCart(cart);
    const url = new URL(window.location.href);
    url.searchParams.set("pedido", order.id);
    window.history.replaceState({}, "", url);
    showReceipt(order);
    document.querySelector("#done-title").focus();
  }, 1200);
});

const requested = new URLSearchParams(window.location.search).get("pedido");
if (requested) {
  const order = readOrders().find((entry) => entry.id === requested);
  if (order) showReceipt(order);
  else showCheckout();
} else {
  showCheckout();
}
