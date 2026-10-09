import { games } from "./games.js";

const grid = document.getElementById("grid");
const filters = document.getElementById("filters");
const finder = document.getElementById("finder");
const query = document.getElementById("query");
const empty = document.getElementById("empty");
const lobby = document.getElementById("lobby");
const player = document.getElementById("player");
const frameHost = document.getElementById("frame-host");
const playerTitle = document.getElementById("player-title");
const playerHost = document.getElementById("player-host");
const playerStatus = document.getElementById("player-status");
const toast = document.getElementById("toast");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js",
  },
});

scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

let activeCategory = "All";
let currentUrl = "";
let frame = null;

const categories = ["All", ...new Set(games.map((game) => game.category))];

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function showToast(message) {
  toast.hidden = false;
  toast.textContent = message;
}

function hideToast() {
  toast.hidden = true;
  toast.textContent = "";
}

function renderFilters() {
  filters.replaceChildren(
    ...categories.map((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = category;
      button.className = category === activeCategory ? "on" : "";
      button.setAttribute("role", "tab");
      button.setAttribute(
        "aria-selected",
        category === activeCategory ? "true" : "false",
      );
      button.addEventListener("click", () => {
        activeCategory = category;
        renderFilters();
        renderGrid();
      });
      return button;
    }),
  );
}

function visibleGames() {
  const term = query.value.trim().toLowerCase();
  return games.filter((game) => {
    const inCategory =
      activeCategory === "All" || game.category === activeCategory;
    if (!inCategory) return false;
    if (!term || looksLikeUrl(term)) return true;
    return (
      game.title.toLowerCase().includes(term) ||
      game.category.toLowerCase().includes(term) ||
      hostOf(game.url).toLowerCase().includes(term)
    );
  });
}

function renderGrid() {
  const list = visibleGames();
  empty.hidden = list.length > 0;
  grid.replaceChildren(
    ...list.map((game, index) => {
      const card = document.createElement("article");
      card.className = "card";
      card.dataset.category = game.category;

      const indexEl = document.createElement("span");
      indexEl.className = "index";
      indexEl.textContent = String(index + 1).padStart(2, "0");

      const body = document.createElement("div");
      const title = document.createElement("h2");
      title.textContent = game.title;
      const meta = document.createElement("p");
      meta.textContent = `${game.category} · ${hostOf(game.url)}`;
      body.append(title, meta);

      const play = document.createElement("button");
      play.type = "button";
      play.textContent = "Play";
      play.addEventListener("click", () => launch(game.url, game.title));

      card.append(indexEl, body, play);
      return card;
    }),
  );
}

function looksLikeUrl(value) {
  return (
    /^https?:\/\//i.test(value) ||
    /^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(value)
  );
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (looksLikeUrl(trimmed)) return `https://${trimmed}`;
  return "";
}

async function ensureTransport() {
  const wispUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`;
  if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
    await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
  }
}

async function launch(url, title) {
  hideToast();
  playerStatus.hidden = false;
  playerStatus.textContent = "Opening through Scramjet…";
  playerTitle.textContent = title;
  playerHost.textContent = hostOf(url);
  lobby.hidden = true;
  player.hidden = false;
  currentUrl = url;
  history.replaceState({ url, title }, "", `#${encodeURIComponent(url)}`);

  try {
    await registerSW();
    await ensureTransport();
    frame?.frame?.remove();
    frame = scramjet.createFrame();
    frame.frame.className = "game-frame";
    frame.frame.title = title;
    frameHost.replaceChildren(frame.frame);
    frame.go(url);
    playerStatus.hidden = true;
  } catch (error) {
    playerStatus.hidden = false;
    playerStatus.textContent = "Scramjet could not open this game.";
    showToast(error instanceof Error ? error.message : String(error));
  }
}

function closePlayer() {
  frame?.frame?.remove();
  frame = null;
  currentUrl = "";
  player.hidden = true;
  lobby.hidden = false;
  history.replaceState(null, "", location.pathname);
}

document.getElementById("back").addEventListener("click", closePlayer);
document.getElementById("reload").addEventListener("click", () => {
  if (currentUrl) launch(currentUrl, playerTitle.textContent || "Game");
});

finder.addEventListener("submit", (event) => {
  event.preventDefault();
  const direct = normalizeUrl(query.value);
  if (direct) {
    launch(direct, hostOf(direct));
    return;
  }
  renderGrid();
});

query.addEventListener("input", () => {
  if (!looksLikeUrl(query.value.trim())) renderGrid();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !player.hidden) closePlayer();
});

function restoreHash() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (!hash) return;
  const known = games.find((game) => game.url === hash);
  launch(hash, known?.title || hostOf(hash));
}

renderFilters();
renderGrid();
restoreHash();
