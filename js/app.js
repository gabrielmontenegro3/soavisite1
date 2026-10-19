let cart = readCart();
let filter = "todos";
let toastTimer = 0;
let lastFocus = null;

const grid = document.querySelector("#grid");
const resultCount = document.querySelector("#result-count");
const cartEl = document.querySelector("#cart");
const cartItems = document.querySelector("#cart-items");
const cartEmpty = document.querySelector("#cart-empty");
const cartFoot = document.querySelector("#cart-foot");
const backdrop = document.querySelector("#backdrop");
const countEl = document.querySelector("#cart-count");
const openCartBtn = document.querySelector("#open-cart");
const closeCartBtn = document.querySelector("#close-cart");
const dialog = document.querySelector("#product-dialog");
const toast = document.querySelector("#toast");
const nav = document.querySelector("#site-nav");
const menuToggle = document.querySelector("#menu-toggle");

function saveCart() {
  writeCart(cart);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function productPhoto(product) {
  const img = document.createElement("img");
  img.src = product.image;
  img.alt = "";
  return img;
}

function art(product, className) {
  const node = el("div", className);
  node.append(productPhoto(product));
  return node;
}

function visibleProducts() {
  if (filter === "todos") return products;
  return products.filter((product) => product.category === filter);
}

function renderProducts() {
  const list = visibleProducts();
  grid.replaceChildren();
  grid.dataset.count = String(list.length);
  resultCount.textContent = list.length === 1 ? "1 peça" : `${list.length} peças`;

  list.forEach((product) => {
    const card = el("article", "card");

    const hit = el("button", "card__hit");
    hit.type = "button";
    hit.setAttribute("aria-label", `Ver ${product.name}`);
    hit.append(art(product, "card__art"));
    hit.addEventListener("click", () => openProduct(product.id));

    const title = el("h3");
    const titleBtn = el("button", "card__title", product.name);
    titleBtn.type = "button";
    titleBtn.addEventListener("click", () => openProduct(product.id));
    title.append(titleBtn);

    const add = el("button", "card__add", "Adicionar à sacola");
    add.type = "button";
    add.addEventListener("click", () => addToCart(product.id));

    card.append(
      hit,
      el("p", "card__cat", singular[product.category]),
      title,
      el("p", "card__mat", product.material),
      el("p", "card__price", money.format(product.price)),
      add
    );
    grid.append(card);
  });
}

function updateCount() {
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  countEl.textContent = String(total);
  openCartBtn.setAttribute("aria-label", `Abrir sacola, ${total} ${total === 1 ? "item" : "itens"}`);
}

function renderCart() {
  const focusKey = document.activeElement?.dataset?.focusKey || "";
  cartItems.replaceChildren();

  if (cart.length === 0) {
    cartEmpty.hidden = false;
    cartFoot.hidden = true;
    updateCount();
    return;
  }

  cartEmpty.hidden = true;
  cartFoot.hidden = false;
  let subtotal = 0;

  cart.forEach((item) => {
    const product = findProduct(item.id);
    subtotal += product.price * item.qty;

    const row = el("article", "line");
    const info = el("div");
    info.append(
      el("h3", null, product.name),
      el("p", "line__mat", product.material)
    );

    const qty = el("div", "qty");
    const down = el("button", null, "–");
    down.type = "button";
    down.dataset.focusKey = `down-${product.id}`;
    down.setAttribute("aria-label", `Diminuir ${product.name}`);
    down.addEventListener("click", () => changeQty(product.id, -1));

    const up = el("button", null, "+");
    up.type = "button";
    up.dataset.focusKey = `up-${product.id}`;
    up.setAttribute("aria-label", `Aumentar ${product.name}`);
    up.addEventListener("click", () => changeQty(product.id, 1));

    qty.append(down, el("span", null, String(item.qty)), up);
    info.append(qty);

    const end = el("div", "line__end");
    end.append(el("p", null, money.format(product.price * item.qty)));
    const remove = el("button", null, "Remover");
    remove.type = "button";
    remove.addEventListener("click", () => changeQty(product.id, -item.qty));
    end.append(remove);

    row.append(art(product, "line__art"), info, end);
    cartItems.append(row);
  });

  const shipping = shippingFor(subtotal);
  document.querySelector("#cart-subtotal").textContent = money.format(subtotal);
  document.querySelector("#cart-ship").textContent = shipping === 0 ? "Grátis" : money.format(shipping);
  document.querySelector("#cart-total").textContent = money.format(subtotal + shipping);
  document.querySelector("#ship-note").textContent =
    shipping === 0
      ? "Frete grátis neste pedido."
      : `Faltam ${money.format(FREE_SHIPPING - subtotal)} para frete grátis.`;

  updateCount();
  if (focusKey) {
    cartItems.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
  }
}

function addToCart(id) {
  const item = cart.find((entry) => entry.id === id);
  if (item) item.qty = Math.min(9, item.qty + 1);
  else cart.push({ id, qty: 1 });
  saveCart();
  renderCart();
  const product = findProduct(id);
  showToast(`${product.name} adicionado à sacola`);
}

function changeQty(id, delta) {
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;
  item.qty = Math.min(9, item.qty + delta);
  if (item.qty <= 0) cart = cart.filter((entry) => entry.id !== id);
  saveCart();
  renderCart();
}

function openCart() {
  lastFocus = document.activeElement;
  cartEl.setAttribute("aria-hidden", "false");
  cartEl.inert = false;
  backdrop.hidden = false;
  document.body.classList.add("lock");
  closeCartBtn.focus();
}

function closeCart() {
  cartEl.setAttribute("aria-hidden", "true");
  cartEl.inert = true;
  backdrop.hidden = true;
  document.body.classList.remove("lock");
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
}

function openProduct(id) {
  const product = findProduct(id);
  const frame = document.querySelector("#modal-art");
  frame.replaceChildren(productPhoto(product));
  document.querySelector("#modal-cat").textContent = singular[product.category];
  document.querySelector("#modal-name").textContent = product.name;
  document.querySelector("#modal-material").textContent = product.material;
  document.querySelector("#modal-desc").textContent = product.description;
  document.querySelector("#modal-price").textContent = money.format(product.price);
  dialog.dataset.id = id;
  dialog.showModal();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-on");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 2200);
}

function showError(node, message) {
  node.hidden = !message;
  node.textContent = message || "";
}

document.querySelectorAll(".filters button").forEach((button) => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    document.querySelectorAll(".filters button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderProducts();
  });
});

openCartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
backdrop.addEventListener("click", closeCart);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartEl.getAttribute("aria-hidden") === "false" && !dialog.open) {
    closeCart();
  }
});

document.querySelector("#modal-close").addEventListener("click", () => dialog.close());
document.querySelector("#modal-add").addEventListener("click", () => {
  addToCart(dialog.dataset.id);
  dialog.close();
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menu");
    });
  });
}

document.querySelectorAll(".faq__list").forEach((list) => {
  const triggers = [...list.querySelectorAll(".faq__trigger")];

  const setOpen = (trigger, open) => {
    trigger.setAttribute("aria-expanded", String(open));
    trigger.closest(".faq__item").dataset.state = open ? "open" : "closed";
  };

  triggers.forEach((trigger, index) => {
    // Uma resposta aberta por vez; clicar na aberta fecha de novo.
    trigger.addEventListener("click", () => {
      const open = trigger.getAttribute("aria-expanded") !== "true";
      triggers.forEach((other) => setOpen(other, other === trigger && open));
    });

    trigger.addEventListener("keydown", (event) => {
      const last = triggers.length - 1;
      const next = {
        ArrowDown: index === last ? 0 : index + 1,
        ArrowUp: index === 0 ? last : index - 1,
        Home: 0,
        End: last,
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      triggers[next].focus();
    });
  });
});

document.querySelector("#contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const nome = String(data.get("nome") || "").trim();
  const email = String(data.get("email") || "").trim();
  const mensagem = String(data.get("mensagem") || "").trim();
  const error = document.querySelector("#contact-error");

  if (nome.length < 3 || !email.includes("@") || mensagem.length < 5) {
    showError(error, "Preencha nome, e-mail e uma mensagem curta.");
    return;
  }

  showError(error, "");
  const stored = JSON.parse(localStorage.getItem("soavi-messages") || "[]");
  stored.push({
    nome,
    email,
    mensagem,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem("soavi-messages", JSON.stringify(stored));
  form.reset();
  document.querySelector("#contact-ok").hidden = false;
});

cartEl.inert = true;
renderProducts();
renderCart();
