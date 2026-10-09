importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

const scriptDestinations = new Set(["script", "worker", "sharedworker"]);

async function handleRequest(event) {
  await scramjet.loadConfig();
  if (!scramjet.route(event)) return fetch(event.request);
  const response = await scramjet.fetch(event);
  if (event.request.method === "HEAD" && !response.ok) {
    return headFromRange(event, response);
  }
  if (!scriptDestinations.has(event.request.destination)) return response;
  return repairScript(event.request, response);
}

// libcurl reports a partial transfer for HEAD on large files, which Scramjet
// turns into HTTP 500. One ranged byte carries the same headers.
async function headFromRange(event, failed) {
  const headers = new Headers(event.request.headers);
  headers.set("Range", "bytes=0-0");
  const ranged = new Request(event.request.url, { method: "GET", headers });
  const response = await scramjet.fetch({
    request: ranged,
    clientId: event.clientId,
  });
  if (response.status !== 206) return failed;
  const next = new Headers(response.headers);
  const match = /\/(\d+)\s*$/.exec(next.get("content-range") || "");
  if (match) next.set("content-length", match[1]);
  next.delete("content-range");
  await response.arrayBuffer().catch(() => {});
  return new Response(null, { status: 200, statusText: "OK", headers: next });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function targetFromProxyUrl(requestUrl) {
  const prefix = scramjet.config.prefix;
  const url = new URL(requestUrl);
  if (!url.pathname.startsWith(prefix)) return "";
  try {
    const decoded = decodeURIComponent(url.pathname.slice(prefix.length));
    return /^https?:\/\//i.test(decoded) ? decoded : "";
  } catch {
    return "";
  }
}

// Scramjet's rewriter skips some `location.origin` reads and some
// `import.meta.url` reads. Those keep the proxy origin, so games request
// their files from this host and module workers are blocked.
function repairScript(request, response) {
  const type = response.headers.get("content-type") || "";
  if (type && !/javascript|ecmascript/i.test(type)) return response;
  const wrap = scramjet.config.globals.wrapfn;
  const meta = scramjet.config.globals.metafn;
  const realUrl = targetFromProxyUrl(request.url);
  return response.clone().text().then((source) => {
    let text = source;
    if (realUrl) {
      const base = JSON.stringify(realUrl);
      text = text.replace(
        new RegExp(`(?<!${escapeRegExp(meta)}\\()import\\.meta\\b`, "g"),
        `${meta}(import.meta, ${base})`,
      );
    }
    text = text.replace(
      new RegExp(`(?<!${escapeRegExp(wrap)}\\()(?<![.\\w$])location(?=\\s*(?:\\.|\\[))`, "g"),
      `${wrap}(location)`,
    );
    if (text === source) return response;
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  });
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});
