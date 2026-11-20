const STORAGE_KEY = "todos";
const THEME_KEY = "theme";
const FILTER_KEY = "filter";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const emptyMessage = document.getElementById("empty-message");
const themeToggle = document.getElementById("theme-toggle");
const filterButtons = document.querySelectorAll(".filter");

const EMPTY_MESSAGES = {
  all: "No tasks yet. Add one above!",
  active: "Nothing left to do.",
  done: "No finished tasks yet.",
};

let todos = loadTodos();
let filter = loadFilter();

// Which item to animate on the next render.
let justAddedId = null;
let justToggledId = null;

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return "dark";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

applyTheme(loadTheme());

function loadFilter() {
  const saved = localStorage.getItem(FILTER_KEY);
  return saved in EMPTY_MESSAGES ? saved : "all";
}

function setFilter(next) {
  filter = next;
  localStorage.setItem(FILTER_KEY, next);
  render();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

function updateFilters() {
  const doneCount = todos.filter((todo) => todo.done).length;
  const counts = {
    all: todos.length,
    active: todos.length - doneCount,
    done: doneCount,
  };

  filterButtons.forEach((button) => {
    const name = button.dataset.filter;
    button.setAttribute("aria-pressed", String(name === filter));
    button.querySelector(".filter-count").textContent = counts[name];
  });
}

function visibleTodos() {
  if (filter === "active") return todos.filter((todo) => !todo.done);
  if (filter === "done") return todos.filter((todo) => todo.done);
  return todos;
}

function loadTodos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function render() {
  list.innerHTML = "";
  const shown = visibleTodos();

  shown.forEach((todo) => {
    const item = document.createElement("li");
    item.className = "todo-item" + (todo.done ? " done" : "");
    if (todo.id === justAddedId) item.classList.add("enter");
    if (todo.id === justToggledId) item.classList.add("pop");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.setAttribute("aria-label", "Mark task as done");
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", "Delete task");
    deleteBtn.addEventListener("click", () => removeWithAnimation(item, todo.id));

    item.append(checkbox, text, deleteBtn);
    list.appendChild(item);
  });

  updateFilters();
  emptyMessage.textContent = EMPTY_MESSAGES[todos.length === 0 ? "all" : filter];
  emptyMessage.hidden = shown.length > 0;
  justAddedId = null;
  justToggledId = null;
}

// Delete the task now, then slide the item out before redrawing.
function removeWithAnimation(item, id) {
  if (item.classList.contains("leaving")) return;
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  item.classList.add("leaving");
  item.addEventListener("animationend", (event) => {
    if (event.target === item) render();
  });
}

function addTodo(text) {
  const id = Date.now().toString();
  todos.push({ id, text, done: false });
  justAddedId = id;
  if (filter === "done") {
    filter = "all";
    localStorage.setItem(FILTER_KEY, filter);
  }
  saveTodos();
  render();
}

function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, done: !todo.done } : todo
  );
  justToggledId = id;
  saveTodos();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = "";
  input.focus();
});

render();
