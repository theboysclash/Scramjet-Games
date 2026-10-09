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
        if (req.url?.endsWith("/wisp/")) wisp.routeRequest(req, socket, head);
        else socket.end();
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

fastify.listen({ port, host: "0.0.0.0" }).then(() => {
  const address = fastify.server.address();
  const bound = typeof address === "object" && address ? address.port : port;
  console.log(`Afterburner listening on http://localhost:${bound}`);
  console.log(`and http://${hostname()}:${bound}`);
});
