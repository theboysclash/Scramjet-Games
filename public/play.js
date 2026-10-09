const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js",
  },
});

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const status = document.getElementById("sj-status");
const host = document.getElementById("frame-host");
let frame = null;

const ready = (async () => {
  await scramjet.init();
  await registerSW();
  const wispUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`;
  if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
    await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
  }
})();

function toUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return "";
}

async function openInScramjet(url) {
  status.textContent = "Opening in Scramjet…";
  address.value = url;
  try {
    await ready;
    frame?.frame?.remove();
    frame = scramjet.createFrame();
    frame.frame.title = url;
    host.replaceChildren(frame.frame);
    frame.go(url);
    status.textContent = "";
    const next = `${location.pathname}?url=${encodeURIComponent(url)}`;
    history.replaceState(null, "", next);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const url = toUrl(address.value);
  if (!url) {
    status.textContent = "Paste a full game link.";
    return;
  }
  openInScramjet(url);
});

const initial = toUrl(new URLSearchParams(location.search).get("url") || "");
if (initial) openInScramjet(initial);
