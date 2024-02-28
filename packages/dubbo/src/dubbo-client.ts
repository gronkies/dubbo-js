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
import type { DubboOptions } from "./dubbo";
import { createPromiseClient } from "./promise-client";
import type { Transport } from "./transport";
import { DubboRegistry } from "@apachedubbo/dubbo-registry";
import qs from "querystring";
import { createDubboTransport } from "@apachedubbo/dubbo-node";

// DubboInterface = group:typename:version
type DubboInterface = string;

type DubboUrl = string;

type ConsumerServices = {
  [type: string]: ConsumerService;
};

type DubboService = {
  dubboInterface: string;
  path?: string;
  group?: string;
  version?: string;
  timeout?: number;
  weight?: number;
  currentWeight?: number;
};

interface DubboConsumerOptions {
  group: string;
  version: string;
  name: string;
  service: ServiceType;
  dubboUrlMap: Map<DubboInterface, Array<DubboUrl>>;
  dubboTransportMap: Map<DubboUrl, Transport>;
  dubboServiceMap: Map<DubboUrl, DubboService>;
}

export class DubboClient {
  private readonly application: { name: string };

  private readonly registry: DubboRegistry<Object>;

  private readonly dubboUrlMap: Map<DubboInterface, Array<DubboUrl>>;

  private readonly dubboTransportMap: Map<DubboUrl, Transport>;

  private readonly services: ConsumerServices;

  constructor(options: DubboOptions) {
    // init
    this.application = options.application;
    this.registry = options.registry;
    this.dubboUrlMap = new Map();
    this.dubboTransportMap = new Map();

    // subscribe registry change
    this.subscribe();
  }

  public addConsumerService(options: DubboConsumerOptions) {
    // init options
    options.group = options.group || "";
    options.version = options.version || "";
    options.dubboUrlMap = this.dubboUrlMap;
    options.dubboTransportMap = this.dubboTransportMap;

    this.registerConsumer(options);

    this.services[options.name] = new ConsumerService(options);
  }

  private subscribe() {
    this.registry.subscribe({
      onChange: this.handleRegistryChange,
      onError: this.handleRegistryError
    });
  }

  private handleRegistryChange(map: Map<DubboInterface, Array<DubboUrl>>) {
    for (let [dubboInterface, dubboUrls] of map) {
      // if registry get dubbo url is empty, but in memory dubbo interface map dubbo url is not empty
      // don't override it.
      if (dubboUrls.length === 0 && this.dubboUrlMap.get(dubboInterface)) {
        continue;
      }

      this.dubboUrlMap.set(dubboInterface, dubboUrls);

      dubboUrls.forEach((dubboUrl: string) => {
        const url = new URL(dubboUrl);
        const { hostname, port } = url;
        const host = `${hostname}:${port}`;

        if (!this.dubboTransportMap.has(dubboUrl)) {
          this.dubboTransportMap.set(dubboUrl, createDubboTransport({ baseUrl: host }));
        }
      });
    }
  }

  private handleRegistryError(err: Error) {
    console.log("registry error", err);
  }

  private registerConsumer(options: DubboConsumerOptions) {
    this.registry
      .registerConsumer({
        application: this.application
      })
      .then(() => console.log(`registry consumer success`))
      .catch((err) => console.log(`registry consumer error %s`, err));
  }
}

class ConsumerService {
  private readonly group: string;

  private readonly version: string;

  private readonly service: ServiceType;

  private readonly dubboUrlMap: Map<DubboInterface, Array<DubboUrl>>;

  private readonly dubboTransportMap: Map<DubboUrl, Transport>;

  constructor(options: DubboConsumerOptions) {
    // init
    this.group = options.group;
    this.version = options.version;
    this.service = options.service;
    this.dubboUrlMap = options.dubboUrlMap;
    this.dubboTransportMap = options.dubboTransportMap;

    for (const methodName of Object.keys(Object.keys(this.service.methods))) {
      ConsumerService[methodName] = this.createMethodFunction(methodName);
    }
  }

  private createMethodFunction(methodName: string): Function {
    const dubboUrls = this.findServiceDubboUrls();
    if (dubboUrls.length === 0) {
      throw `no dubboUrl`;
    }

    const transport = this.getAvailableDubboTransport(dubboUrls);
    if (!transport) {
      throw `no transport`;
    }

    return function (params) {
      const client = createPromiseClient(this.service, transport, {
        serviceVersion: this.version,
        serviceGroup: this.group
      });
      client[methodName](params);
    };
  }

  private findServiceDubboUrls() {
    return (
      this.dubboUrlMap.get(this.service.typeName)?.filter((dubboUrl) => {
        const query = qs.parse(dubboUrl) as any;
        const version = query.version || "";
        const group = query.group || "";

        return version === this.version && group === this.group;
      }) || []
    );
  }

  private getAvailableDubboTransport(dubboUrls: Array<DubboUrl>) {
    // randomly choose a url
    const dubboUrl = dubboUrls[Math.floor(Math.random() * dubboUrls.length)];

    return this.dubboTransportMap.get(dubboUrl);
  }
}
