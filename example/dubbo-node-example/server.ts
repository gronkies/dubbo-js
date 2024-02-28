import { fastify } from "fastify";
import { fastifyDubboPlugin } from "@apachedubbo/dubbo-fastify";
import routes from "./dubbo";
import cors from "@fastify/cors";
import { ExampleService } from "./gen/example_dubbo";

// async function main() {
//   const server = fastify();
//   await server.register(fastifyDubboPlugin, {
//     routes,
//   });
//   await server.register(cors, {
//     origin: true,
//   });
//   server.get("/", (_, reply) => {
//     reply.type("text/plain");
//     reply.send("Hello World!");
//   });
//   await server.listen({ host: "localhost", port: 8080 });
//   console.log("server is listening at", server.addresses());
// }

async function main() {
  const dubbo = new Dubbo({
    application: { name: "hello-api" },
    registry: Zk({ connect: "localhost:2181" })
  });

  const dubboServer = dubbo.newServer();

  dubboServer.addProviderService({
    name: "exampleService",
    service: ExampleService,
    group: "dubbo",
    version: "1.0.0"
  });
}

void main();
