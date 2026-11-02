const STORAGE_KEY = "month-expenses-v1";

const BUILTINS = [
  { id: "food", label: "Food", color: "#E07A3D", builtin: true },
  { id: "groceries", label: "Groceries", color: "#5B7F45", builtin: true },
  { id: "transport", label: "Transport", color: "#3B7EA6", builtin: true },
  { id: "shopping", label: "Shopping", color: "#7A5EA7", builtin: true },
  { id: "bills", label: "Bills", color: "#C24D2C", builtin: true },
  { id: "health", label: "Health", color: "#2C8A68", builtin: true },
  { id: "fun", label: "Fun", color: "#C4922E", builtin: true },
  { id: "other", label: "Other", color: "#6E675E", builtin: true },
];

const GLYPHS = {
  food: ["M4 11h16", "M6 11c.4 4.2 2.6 6.5 6 6.5s5.6-2.3 6-6.5", "M12 17.5V20", "M9 20h6"],
  groceries: ["M4 10h16l-1.2 9H5.2L4 10z", "M8 10l1.5-4h5L16 10", "M9 14v3", "M12 14v3", "M15 14v3"],
  transport: ["M6 15l1.5-5h9L18 15", "M4 15h16", "M7 18.4a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8z", "M17 18.4a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8z"],
  shopping: ["M7 8h10l-.8 12H7.8L7 8z", "M9.5 8V7a2.5 2.5 0 0 1 5 0v1"],
  bills: ["M7 3.5h10v17H7z", "M10 8h4", "M10 12h4", "M10 16h2.5"],
  health: ["M12 19s-6.2-3.8-6.2-8A3.4 3.4 0 0 1 12 8.2 3.4 3.4 0 0 1 18.2 11c0 4.2-6.2 8-6.2 8z"],
  fun: ["M4 8h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V8z", "M12 8v10"],
  other: ["M5 5h5v5H5z", "M14 5h5v5h-5z", "M5 14h5v5H5z", "M14 14h5v5h-5z"],
};

const CATEGORY_COLORS = [
  { id: "rose", value: "#D4537E" },
  { id: "blue", value: "#3E6F8A" },
  { id: "plum", value: "#6B5B95" },
  { id: "amber", value: "#C47B2D" },
  { id: "green", value: "#2F7D6D" },
  { id: "clay", value: "#8A5A44" },
];

const now = new Date();
const state = {
  expenses: [],
  budgets: {},
  categories: [],
  year: now.getFullYear(),
  month: now.getMonth(),
  filter: "all",
};

const draft = {
  mode: "add",
  id: null,
  category: "food",
  deleteArmed: false,
  newColor: CATEGORY_COLORS[0].value,
};

const app = document.getElementById("app");
const main = document.getElementById("main");
const topbar = document.querySelector(".topbar");
const fab = document.getElementById("add-btn");
const backdrop = document.getElementById("backdrop");
const expenseSheet = document.getElementById("expense-sheet");
const budgetSheet = document.getElementById("budget-sheet");
const monthLabel = document.getElementById("month-label");
const monthEyebrow = document.getElementById("month-eyebrow");
const sheetTitle = document.getElementById("sheet-title");
const amountInput = document.getElementById("amount");
const noteInput = document.getElementById("note");
const dateInput = document.getElementById("date");
const formError = document.getElementById("form-error");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");
const catPicker = document.getElementById("cat-picker");
const newCatToggle = document.getElementById("new-cat-toggle");
const newCatForm = document.getElementById("new-cat-form");
const newCatName = document.getElementById("new-cat-name");
const newCatSave = document.getElementById("new-cat-save");
const colorRow = document.getElementById("color-row");
const catError = document.getElementById("cat-error");
const removeCatBtn = document.getElementById("remove-cat");
const budgetCopy = document.getElementById("budget-copy");
const budgetInput = document.getElementById("budget-amount");
const budgetError = document.getElementById("budget-error");
const clearBudgetBtn = document.getElementById("clear-budget");
const toast = document.getElementById("toast");

let toastTimer = 0;

function isValidCustom(category) {
  if (!category || typeof category.id !== "string" || !/^[a-z0-9-]{1,40}$/.test(category.id)) return false;
  if (typeof category.label !== "string") return false;
  const label = category.label.trim();
  if (!label || label.length > 24) return false;
  if (!CATEGORY_COLORS.some((color) => color.value === category.color)) return false;
  if (BUILTINS.some((builtin) => builtin.id === category.id || builtin.label.toLowerCase() === label.toLowerCase())) return false;
  return true;
}

function isValidExpense(expense) {
  return Boolean(
    expense &&
      typeof expense.id === "string" &&
      Number.isInteger(expense.amount) &&
      expense.amount > 0 &&
      state.categories.some((category) => category.id === expense.category) &&
      /^\d{4}-\d{2}-\d{2}$/.test(expense.date)
  );
}

function load() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    saved = {};
  }
  const custom = [];
  const seen = new Set();
  for (const category of Array.isArray(saved.categories) ? saved.categories : []) {
    if (!isValidCustom(category) || seen.has(category.id)) continue;
    seen.add(category.id);
    custom.push({
      id: category.id,
      label: category.label.trim().replace(/\s+/g, " "),
      color: category.color,
      builtin: false,
    });
  }
  state.categories = BUILTINS.concat(custom);
  state.expenses = Array.isArray(saved.expenses) ? saved.expenses.filter(isValidExpense) : [];
  state.budgets = {};
  if (saved.budgets && typeof saved.budgets === "object") {
    for (const [key, value] of Object.entries(saved.budgets)) {
      if (/^\d{4}-\d{2}$/.test(key) && Number.isInteger(value) && value > 0) state.budgets[key] = value;
    }
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    expenses: state.expenses,
    budgets: state.budgets,
    categories: state.categories.filter((category) => !category.builtin),
  }));
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (value === true) node.setAttribute(key, "");
    else if (value !== false && value != null) node.setAttribute(key, String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function glyph(paths) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  for (const d of paths) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.7");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
  }
  return svg;
}

function categoryById(id) {
  return state.categories.find((category) => category.id === id) || {
    id: "other",
    label: "Other",
    color: "#6E675E",
    builtin: true,
  };
}

function categoryMark(category) {
  const paths = GLYPHS[category.id];
  if (paths) return glyph(paths);
  const letter = (category.label || "?").trim().slice(0, 1).toUpperCase() || "?";
  return el("span", { class: "cat-letter" }, [letter]);
}

function hexToRgba(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentMonthKey() {
  return `${state.year}-${String(state.month + 1).padStart(2, "0")}`;
}

function monthTitle() {
  return new Date(state.year, state.month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function monthName() {
  return new Date(state.year, state.month, 1).toLocaleDateString("en-US", { month: "long" });
}

function eyebrowForMonth() {
  const today = new Date();
  const diff = (state.year - today.getFullYear()) * 12 + (state.month - today.getMonth());
  if (diff === 0) return "This month";
  if (diff === -1) return "Last month";
  if (diff === 1) return "Next month";
  return "Spending";
}

function dayLabel(iso) {
  const today = formatISODate(new Date());
  if (iso === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (iso === formatISODate(yesterday)) return "Yesterday";
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function defaultDate() {
  const today = new Date();
  if (state.year === today.getFullYear() && state.month === today.getMonth()) return formatISODate(today);
  return formatISODate(new Date(state.year, state.month, 1));
}

function formatMoney(cents) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatInputAmount(cents) {
  const value = cents / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function countLabel(count) {
  return count === 1 ? "1 expense" : `${count} expenses`;
}

function parseAmount(raw) {
  const cleaned = String(raw).replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  if (!Number.isFinite(cents) || cents <= 0 || cents > 10000000000) return null;
  return cents;
}

function sanitizeMoneyInput(input) {
  let value = input.value.replace(/[^\d.]/g, "");
  const parts = value.split(".");
  if (parts.length > 2) value = `${parts[0]}.${parts.slice(1).join("")}`;
  const [whole, fraction] = value.split(".");
  input.value = fraction === undefined ? whole : `${whole}.${fraction.slice(0, 2)}`;
}

function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function getMonthData() {
  const key = currentMonthKey();
  const monthExpenses = state.expenses
    .filter((expense) => expense.date.slice(0, 7) === key)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  if (state.filter !== "all" && !monthExpenses.some((expense) => expense.category === state.filter)) {
    state.filter = "all";
  }
  const filtered = state.filter === "all"
    ? monthExpenses
    : monthExpenses.filter((expense) => expense.category === state.filter);
  const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totals = state.categories
    .map((category) => ({
      ...category,
      total: monthExpenses
        .filter((expense) => expense.category === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0),
    }))
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total);
  return {
    monthExpenses,
    filtered,
    total,
    budget: state.budgets[key] || 0,
    totals,
    groups: groupExpenses(filtered),
    allGroups: groupExpenses(monthExpenses),
  };
}

function groupExpenses(expenses) {
  const groups = [];
  for (const expense of expenses) {
    const last = groups[groups.length - 1];
    if (!last || last.date !== expense.date) {
      groups.push({ date: expense.date, items: [expense], total: expense.amount });
    } else {
      last.items.push(expense);
      last.total += expense.amount;
    }
  }
  return groups;
}

function render() {
  const data = getMonthData();
  monthLabel.textContent = monthTitle();
  monthEyebrow.textContent = eyebrowForMonth();
  main.replaceChildren(...[summaryCard(data), categoryStrip(data), listSection(data)].filter(Boolean));
}

function summaryCard(data) {
  const children = [
    el("p", { class: "summary-kicker" }, ["Spent"]),
    el("p", { class: "summary-amount" }, [formatMoney(data.total)]),
    el("p", { class: "summary-meta" }, [countLabel(data.monthExpenses.length)]),
  ];
  if (data.budget) {
    const left = data.budget - data.total;
    const ratio = Math.min(data.total / data.budget, 1);
    const fill = el("span", { class: "bar-fill" });
    fill.style.width = `${ratio * 100}%`;
    const bar = el("span", { class: left < 0 ? "bar over" : "bar" }, [fill]);
    children.push(el("button", {
      type: "button",
      class: "budget-btn",
      "data-action": "budget",
      "aria-label": "Edit monthly budget",
    }, [
      el("span", { class: "budget-row" }, [
        left >= 0 ? `${formatMoney(left)} left` : `${formatMoney(-left)} over`,
        el("span", { class: "edit" }, ["Edit"]),
      ]),
      bar,
    ]));
  } else {
    children.push(el("button", { type: "button", class: "ghost-btn", "data-action": "budget" }, ["Set a monthly budget"]));
  }
  return el("section", { class: "summary" }, children);
}

function categoryStrip(data) {
  if (!data.totals.length) return null;
  return el("div", { class: "cat-scroll" }, data.totals.map((category) => {
    const pressed = state.filter === category.id;
    const card = el("button", {
      type: "button",
      class: "mini",
      "data-filter": category.id,
      "aria-pressed": pressed ? "true" : "false",
      "aria-label": `Show ${category.label}`,
    }, [
      el("span", { class: "swatch" }),
      el("b", {}, [formatMoney(category.total)]),
      el("span", {}, [category.label]),
    ]);
    card.querySelector(".swatch").style.background = category.color;
    return card;
  }));
}

function listSection(data) {
  const heading = state.filter === "all" ? "Expenses" : categoryById(state.filter).label;
  const section = el("section", {}, [
    el("div", { class: "section-head" }, [
      el("h2", {}, [heading]),
      el("div", { class: "section-actions" }, [
        state.filter !== "all" ? el("button", { type: "button", class: "text-btn", "data-filter": "all" }, ["Show all"]) : null,
        data.monthExpenses.length ? el("button", { type: "button", class: "text-btn", "data-action": "share" }, ["Share"]) : null,
      ]),
    ]),
  ]);

  if (!data.monthExpenses.length) {
    section.append(el("div", { class: "empty" }, [
      el("div", { class: "empty-mark" }, ["₹"]),
      el("h2", {}, ["Nothing here yet"]),
      el("p", {}, [`No expenses in ${monthName()}. Add one, and it stays in this browser.`]),
    ]));
    return section;
  }

  if (!data.filtered.length) {
    section.append(el("p", { class: "filter-empty" }, ["Nothing in this category."]));
    return section;
  }

  const days = el("div", { class: "days" });
  for (const group of data.groups) {
    days.append(el("div", { class: "day-head" }, [
      el("h3", {}, [dayLabel(group.date)]),
      el("span", {}, [formatMoney(group.total)]),
    ]));
    const stack = el("div", { class: "stack" });
    for (const expense of group.items) {
      const category = categoryById(expense.category);
      const dot = el("span", { class: "dot" }, [categoryMark(category)]);
      dot.style.background = hexToRgba(category.color, 0.16);
      dot.style.color = category.color;
      const title = expense.note || category.label;
      stack.append(el("button", {
        type: "button",
        class: "expense",
        "data-expense-id": expense.id,
        "aria-label": `Edit ${title}, ${formatMoney(expense.amount)}`,
      }, [
        dot,
        el("span", { class: "expense-copy" }, [
          el("p", { class: "expense-title" }, [title]),
          expense.note ? el("p", { class: "expense-meta" }, [category.label]) : null,
        ]),
        el("span", { class: "expense-amount" }, [formatMoney(expense.amount)]),
      ]));
    }
    days.append(stack);
  }
  section.append(days);
  return section;
}

function renderCategoryPicker() {
  catPicker.replaceChildren();
  for (const category of state.categories) {
    const selected = category.id === draft.category;
    const button = el("button", {
      type: "button",
      class: "cat-btn",
      "aria-pressed": selected ? "true" : "false",
    }, [categoryMark(category), category.label]);
    button.style.color = category.color;
    if (selected) {
      button.style.borderColor = category.color;
      button.style.background = hexToRgba(category.color, 0.12);
    }
    button.addEventListener("click", () => {
      draft.category = category.id;
      renderCategoryPicker();
    });
    catPicker.append(button);
  }
  updateCategoryTools();
}

function renderColorPicker() {
  colorRow.replaceChildren();
  for (const color of CATEGORY_COLORS) {
    const button = el("button", {
      type: "button",
      class: "swatch-btn",
      "aria-label": `${color.id} color`,
      "aria-pressed": color.value === draft.newColor ? "true" : "false",
    });
    button.style.background = color.value;
    button.addEventListener("click", () => {
      draft.newColor = color.value;
      renderColorPicker();
    });
    colorRow.append(button);
  }
}

function updateCategoryTools() {
  const category = state.categories.find((item) => item.id === draft.category);
  const custom = Boolean(category && !category.builtin);
  removeCatBtn.hidden = !custom;
  removeCatBtn.textContent = custom ? `Remove ${category.label}` : "Remove category";
}

function resetNewCategory() {
  newCatForm.hidden = true;
  newCatName.value = "";
  catError.textContent = "";
  draft.newColor = CATEGORY_COLORS[0].value;
  renderColorPicker();
  updateCategoryTools();
}

function focusField(input, { select = false } = {}) {
  input.focus({ preventScroll: true });
  if (select) input.select();
  if (window.scrollY) window.scrollTo(0, 0);
  requestAnimationFrame(placeSheetAboveKeyboard);
}

function lockAppHeight() {
  if (app.dataset.locked === "true") return;
  app.dataset.locked = "true";
  app.style.height = `${Math.round(app.getBoundingClientRect().height)}px`;
}

function unlockAppHeight() {
  app.dataset.locked = "false";
  app.style.height = "";
}

function openSheet(sheet) {
  lockAppHeight();
  for (const item of [expenseSheet, budgetSheet]) {
    item.classList.remove("open");
    item.setAttribute("aria-hidden", "true");
    item.scrollTop = 0;
  }
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
  backdrop.classList.add("open");
  fab.classList.add("hidden");
  app.classList.add("sheet-open");
  main.inert = true;
  topbar.inert = true;
  sheet.scrollTop = 0;
  placeSheetAboveKeyboard();
}

function closeSheets() {
  expenseSheet.classList.remove("open");
  budgetSheet.classList.remove("open");
  expenseSheet.setAttribute("aria-hidden", "true");
  budgetSheet.setAttribute("aria-hidden", "true");
  backdrop.classList.remove("open");
  fab.classList.remove("hidden");
  app.classList.remove("sheet-open");
  main.inert = false;
  topbar.inert = false;
  for (const sheet of [expenseSheet, budgetSheet]) {
    sheet.style.bottom = "";
    sheet.style.maxHeight = "";
    sheet.scrollTop = 0;
  }
  unlockAppHeight();
  if (window.scrollY) window.scrollTo(0, 0);
  draft.deleteArmed = false;
  deleteBtn.textContent = "Delete expense";
  formError.textContent = "";
  budgetError.textContent = "";
  resetNewCategory();
}

function openAdd() {
  draft.mode = "add";
  draft.id = null;
  draft.category = "food";
  draft.deleteArmed = false;
  sheetTitle.textContent = "Add expense";
  saveBtn.textContent = "Save expense";
  deleteBtn.hidden = true;
  amountInput.value = "";
  noteInput.value = "";
  dateInput.value = defaultDate();
  formError.textContent = "";
  resetNewCategory();
  renderCategoryPicker();
  openSheet(expenseSheet);
  focusField(amountInput);
}

function openEdit(expense) {
  draft.mode = "edit";
  draft.id = expense.id;
  draft.category = expense.category;
  draft.deleteArmed = false;
  sheetTitle.textContent = "Edit expense";
  saveBtn.textContent = "Save changes";
  deleteBtn.hidden = false;
  deleteBtn.textContent = "Delete expense";
  amountInput.value = formatInputAmount(expense.amount);
  noteInput.value = expense.note || "";
  dateInput.value = expense.date;
  formError.textContent = "";
  resetNewCategory();
  renderCategoryPicker();
  openSheet(expenseSheet);
  focusField(amountInput, { select: true });
}

function openBudget() {
  const existing = state.budgets[currentMonthKey()] || 0;
  budgetCopy.textContent = `How much do you want to spend in ${monthName()}?`;
  budgetInput.value = existing ? formatInputAmount(existing) : "";
  budgetError.textContent = "";
  clearBudgetBtn.hidden = !existing;
  openSheet(budgetSheet);
  focusField(budgetInput, { select: Boolean(existing) });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function buildSummary(data) {
  const lines = [`${monthTitle()} expenses`, `Total: ${formatMoney(data.total)}`];
  if (data.budget) lines.push(`Budget: ${formatMoney(data.budget)}`);
  lines.push("");
  for (const category of data.totals) lines.push(`${category.label}: ${formatMoney(category.total)}`);
  lines.push("");
  for (const group of data.allGroups) {
    lines.push(dayLabel(group.date));
    for (const expense of group.items) {
      const category = categoryById(expense.category);
      const label = expense.note ? `${expense.note} (${category.label})` : category.label;
      lines.push(`- ${label}: ${formatMoney(expense.amount)}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

async function shareMonth() {
  const data = getMonthData();
  const text = buildSummary(data);
  if (navigator.share) {
    try {
      await navigator.share({ title: `${monthTitle()} expenses`, text });
      return;
    } catch (error) {
      if (error && error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("Summary copied");
  } catch {
    showToast("Couldn't share the summary");
  }
}

function saveExpense(event) {
  event.preventDefault();
  const cents = parseAmount(amountInput.value);
  if (cents == null) {
    formError.textContent = "Enter an amount greater than zero.";
    amountInput.focus();
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput.value)) {
    formError.textContent = "Choose a date.";
    dateInput.focus();
    return;
  }
  const note = noteInput.value.trim().slice(0, 80);
  if (draft.mode === "add") {
    state.expenses.push({
      id: uid(),
      amount: cents,
      category: draft.category,
      note,
      date: dateInput.value,
      createdAt: Date.now(),
    });
  } else {
    const expense = state.expenses.find((item) => item.id === draft.id);
    if (expense) {
      expense.amount = cents;
      expense.category = draft.category;
      expense.note = note;
      expense.date = dateInput.value;
    }
  }
  const [year, month] = dateInput.value.split("-").map(Number);
  state.year = year;
  state.month = month - 1;
  state.filter = "all";
  persist();
  closeSheets();
  render();
  main.scrollTop = 0;
}

function saveBudget(event) {
  event.preventDefault();
  const cents = parseAmount(budgetInput.value);
  if (cents == null) {
    budgetError.textContent = "Enter a budget greater than zero.";
    budgetInput.focus();
    return;
  }
  state.budgets[currentMonthKey()] = cents;
  persist();
  closeSheets();
  render();
}

function addCategory() {
  const label = newCatName.value.trim().replace(/\s+/g, " ");
  if (!label || label.length > 24) {
    catError.textContent = "Enter a category name up to 24 characters.";
    newCatName.focus();
    return;
  }
  if (state.categories.some((category) => category.label.toLowerCase() === label.toLowerCase())) {
    catError.textContent = "That category already exists.";
    newCatName.focus();
    return;
  }
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "category";
  const category = {
    id: `${slug}-${Math.random().toString(16).slice(2, 6)}`,
    label,
    color: draft.newColor,
    builtin: false,
  };
  state.categories.push(category);
  draft.category = category.id;
  persist();
  resetNewCategory();
  renderCategoryPicker();
}

function removeCategory() {
  const category = state.categories.find((item) => item.id === draft.category);
  if (!category || category.builtin) return;
  if (state.expenses.some((expense) => expense.category === category.id)) {
    catError.textContent = "This category still has expenses.";
    newCatForm.hidden = false;
    return;
  }
  state.categories = state.categories.filter((item) => item.id !== category.id);
  if (state.filter === category.id) state.filter = "all";
  draft.category = "food";
  persist();
  resetNewCategory();
  renderCategoryPicker();
  render();
}

function shiftMonth(delta) {
  const next = new Date(state.year, state.month + delta, 1);
  state.year = next.getFullYear();
  state.month = next.getMonth();
  state.filter = "all";
  render();
  main.scrollTop = 0;
}

function placeSheetAboveKeyboard() {
  const open = [expenseSheet, budgetSheet].find((sheet) => sheet.classList.contains("open"));
  for (const sheet of [expenseSheet, budgetSheet]) {
    if (sheet !== open) {
      sheet.style.bottom = "";
      sheet.style.maxHeight = "";
    }
  }
  if (!open) return;
  if (window.scrollY) window.scrollTo(0, 0);
  const viewport = window.visualViewport;
  if (!viewport) return;
  const appRect = app.getBoundingClientRect();
  const visibleBottom = viewport.offsetTop + viewport.height;
  const lift = Math.max(0, Math.round(appRect.bottom - visibleBottom));
  if (lift < 40) {
    open.style.bottom = "";
    open.style.maxHeight = "";
    return;
  }
  const available = Math.min(appRect.height - lift, viewport.height) - 16;
  open.style.bottom = `${lift}px`;
  open.style.maxHeight = `${Math.max(280, available)}px`;
}

document.getElementById("prev-month").addEventListener("click", () => shiftMonth(-1));
document.getElementById("next-month").addEventListener("click", () => shiftMonth(1));
fab.addEventListener("click", openAdd);
document.getElementById("sheet-close").addEventListener("click", closeSheets);
document.getElementById("budget-close").addEventListener("click", closeSheets);
backdrop.addEventListener("click", closeSheets);
expenseSheet.addEventListener("submit", saveExpense);
budgetSheet.addEventListener("submit", saveBudget);
amountInput.addEventListener("input", () => {
  sanitizeMoneyInput(amountInput);
  formError.textContent = "";
});
budgetInput.addEventListener("input", () => {
  sanitizeMoneyInput(budgetInput);
  budgetError.textContent = "";
});

deleteBtn.addEventListener("click", () => {
  if (!draft.deleteArmed) {
    draft.deleteArmed = true;
    deleteBtn.textContent = "Tap again to delete";
    return;
  }
  state.expenses = state.expenses.filter((expense) => expense.id !== draft.id);
  persist();
  closeSheets();
  render();
});

clearBudgetBtn.addEventListener("click", () => {
  delete state.budgets[currentMonthKey()];
  persist();
  closeSheets();
  render();
});

newCatToggle.addEventListener("click", () => {
  newCatForm.hidden = !newCatForm.hidden;
  catError.textContent = "";
  if (!newCatForm.hidden) focusField(newCatName);
});
newCatSave.addEventListener("click", addCategory);
removeCatBtn.addEventListener("click", removeCategory);
newCatName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addCategory();
  }
});
newCatName.addEventListener("input", () => {
  catError.textContent = "";
});

main.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (action) {
    if (action.dataset.action === "budget") openBudget();
    if (action.dataset.action === "share") shareMonth();
    return;
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    state.filter = filter.dataset.filter === state.filter ? "all" : filter.dataset.filter;
    render();
    return;
  }
  const row = event.target.closest("[data-expense-id]");
  if (!row) return;
  const expense = state.expenses.find((item) => item.id === row.dataset.expenseId);
  if (expense) openEdit(expense);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSheets();
});

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", placeSheetAboveKeyboard);
  window.visualViewport.addEventListener("scroll", placeSheetAboveKeyboard);
}

load();
render();
