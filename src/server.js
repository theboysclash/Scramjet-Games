import { createServer } from "node:http";
import { hostname } from "node:os";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { logging, server as wisp } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));

logging.set_level(logging.NONE);
Object.assign(wisp.options, {
  allow_udp_streams: false,
  dns_servers: ["1.1.1.1", "1.0.0.1"],
});

const fastify = Fastify({
  serverFactory(handler) {
    return createServer()
      .on("request", (req, res) => {
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        handler(req, res);
      })
      .on("upgrade", (req, socket, head) => {
        const path = (req.url || "").split("?")[0];
        if (path === "/wisp" || path.endsWith("/wisp/")) {
          wisp.routeRequest(req, socket, head);
        } else socket.end();
      });
  },
});

fastify.register(fastifyStatic, {
  root: publicPath,
  decorateReply: true,
});

fastify.register(fastifyStatic, {
  root: scramjetPath,
  prefix: "/scram/",
  decorateReply: false,
});

fastify.register(fastifyStatic, {
  root: libcurlPath,
  prefix: "/libcurl/",
  decorateReply: false,
});

fastify.register(fastifyStatic, {
  root: baremuxPath,
  prefix: "/baremux/",
  decorateReply: false,
});

fastify.setNotFoundHandler((request, reply) => {
  return reply.code(404).type("text/html").sendFile("404.html");
});

const port = Number(process.env.PORT) || 8080;

if (await alreadyServing(port)) {
  console.log(`Afterburner is already running on http://localhost:${port}`);
  printCodespace(port);
  process.exit(0);
}

try {
  await fastify.listen({ port, host: "0.0.0.0" });
} catch (error) {
  const code = error && typeof error === "object" ? error.code : "";
  if (code === "EADDRINUSE") {
    console.error(
      `Port ${port} is in use, but it is not serving this site. Stop that process, then run pnpm start again.`,
    );
    process.exit(1);
  }
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

console.log(`Afterburner listening on http://localhost:${port}`);
console.log(`and http://${hostname()}:${port}`);
printCodespace(port);

function printCodespace(bound) {
  const codespace = process.env.CODESPACE_NAME;
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  if (codespace && domain) {
    console.log(`Codespace URL: https://${codespace}-${bound}.${domain}`);
  }
}

async function alreadyServing(bound) {
  try {
    const response = await fetch(`http://127.0.0.1:${bound}/`, {
      signal: AbortSignal.timeout(1500),
    });
    const text = await response.text();
    return response.ok && text.includes("<title>Games</title>");
  } catch {
    return false;
  }
}
