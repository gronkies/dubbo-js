import { createPromiseClient } from "@apachedubbo/dubbo";
import { ExampleService } from "./gen/example_dubbo";
import { createDubboTransport } from "@apachedubbo/dubbo-node";

// const transport = createDubboTransport({
//   baseUrl: "http://localhost:8080",
//   httpVersion: "1.1",
// });

// async function main() {
//   const client = createPromiseClient(ExampleService, transport, { serviceVersion: '1.0.0', serviceGroup: 'dubbo' });
//   const res = await client.say({ sentence: "Hello World" });
//   console.log(res);
// }
// void main();

const dubbo = new Dubbo<typeof ExampleService>({
  application: { name: "hello-api" },
  registry: Zk({ connect: "localhost:2181" })
});

const dubboClient = dubbo.newClient();

dubboClient.addConsumerService({
  name: "exampleService",
  service: ExampleService,
  group: "dubbo",
  version: "1.0.0"
});

const res = await dubboClient.exampleService.say({ sentence: "Hello World" });
console.log(res);
