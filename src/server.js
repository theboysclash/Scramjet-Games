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

const requestedPort = Number(process.env.PORT) || 8080;

try {
  await listenFrom(requestedPort);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

async function listenFrom(startPort) {
  const lastPort = startPort + 20;
  for (let port = startPort; port <= lastPort; port += 1) {
    try {
      await fastify.listen({ port, host: "0.0.0.0" });
      const address = fastify.server.address();
      const bound = typeof address === "object" && address ? address.port : port;
      if (bound !== startPort) {
        console.log(`Port ${startPort} is already open, so this server is using ${bound}.`);
      }
      console.log(`Afterburner listening on http://localhost:${bound}`);
      console.log(`and http://${hostname()}:${bound}`);

      const codespace = process.env.CODESPACE_NAME;
      const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
      if (codespace && domain) {
        console.log(`Codespace URL: https://${codespace}-${bound}.${domain}`);
      }
      return;
    } catch (error) {
      const code = error && typeof error === "object" ? error.code : "";
      if (code === "EADDRINUSE" && port < lastPort && !process.env.PORT) {
        continue;
      }
      throw error;
    }
  }
}
