import { fastify } from "fastify";
import { fastifyConnectPlugin } from "apache-dubbo-fastify";
import routes from "./connect";
import cors from "@fastify/cors";

async function main() {
  const server = fastify();
  await server.register(fastifyConnectPlugin, {
    routes,
  });
  await server.register(cors, {
    origin: true,
  });
  server.get("/", (_, reply) => {
    reply.type("text/plain");
    reply.send("Hello World!");
  });
  await server.listen({ host: "localhost", port: 8080 });
  console.log("server is listening at", server.addresses());
}

void main();