// Copyright 2021-2023 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { ServiceType } from "@bufbuild/protobuf";
import { DubboOptions } from "./dubbo";
import { DubboRegistry } from "@apachedubbo/dubbo-registry";

interface DubboProviderOptions {
  group: string;
  version: string;
  service: ServiceType;
  port: number;
}

export class DubboServer {
  private readonly application: { name: string };

  private readonly registry: DubboRegistry<Object>;

  constructor(options: DubboOptions) {
    this.registry = options.registry;
    this.application = options.application;

    this.createServer();
  }

  public addProviderService(options: DubboProviderOptions) {
    this.registry.registerService({
      application: this.application
    });
  }

  private createServer() {
    const server = fastify();
    await server.register(fastifyDubboPlugin, {
      routes
    });
    await server.register(cors, {
      origin: true
    });
    server.get("/", (_, reply) => {
      reply.type("text/plain");
      reply.send("Hello World!");
    });
    await server.listen({ host: "localhost", port: 8080 });
  }
}
