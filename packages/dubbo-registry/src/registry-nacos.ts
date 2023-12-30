/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import debug from "debug";
import BaseRegistry from "./registry-base";
import { DubboRegistry } from "./registry";
import qs from "querystring";
import { IDubboService, INaocsClientProps, RegisterConsumerService } from "./types";

// log
const dlog = debug("dubbo:nacos~");
const NacosNamingClient = require("nacos").NacosNamingClient;

// nacos debug
export class NacosRegistry extends BaseRegistry implements DubboRegistry<typeof NacosNamingClient> {
  private readonly props: INaocsClientProps;
  private client: typeof NacosNamingClient;

  private readonly readyPromise: Promise<void>;
  private resolve: Function;
  private reject: Function;

  constructor(props: INaocsClientProps) {
    super();
    dlog(`init nacos with %O`, props);
    NacosRegistry.checkProps(props);
    this.props = props;
    this.props.namespace = this.props.namespace || "default";

    // init ready promise
    this.readyPromise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    // init nacos client
    this.init();
  }

  // ~~~~~~~~~~~~~~~~ private ~~~~~~~~~~~~~~~~~~~~~~~~~~

  // nacos connect
  private async init() {
    // support nacos cluster
    let serverList = this.props.connect.split(",");
    let namespace = this.props.namespace || "public";
    let logger = this.props.logger || console;
    dlog(`connecting nacos server ${serverList}`);

    this.client = new NacosNamingClient({
      serverList,
      namespace,
      logger
    });

    try {
      await this.client.ready();
      this.resolve();
    } catch (err) {
      this.reject(err);
    }
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  async findDubboServiceUrls(dubboInterfaces: Array<string>) {
    dlog("find dubbo service urls => %O", dubboInterfaces);
    await Promise.all(
      dubboInterfaces.map((dubboInterface) => this.findDubboServiceUrl(dubboInterface))
    );
  }

  async findDubboServiceUrl(dubboInterface: string) {
    this.client.subscribe(dubboInterface, (dubboServiceUrls) => {
      dlog("dubboServiceUrls => %O", dubboServiceUrls);
      const urls = dubboServiceUrls.map((item) => {
        const { ip, port, serviceName, metadata } = item;
        const inf = serviceName.split("@@")[1];
        return `beehive://${ip}:${port}/${inf}?${qs.stringify(metadata)}`;
      });
      this.dubboServiceUrlMap.set(dubboInterface, urls);
      dlog("urls => %O", urls);
      this.emitData(this.dubboServiceUrlMap);
    });
  }

  // 注册服务提供
  async registerServices(meta: {
    application: { name: string };
    port: number;
    dubbo?: string;
    services: Array<IDubboService>;
  }) {
    dlog(meta);
    // dlog('services => %O', services)
    // for (let { dubboServiceInterface, dubboServiceUrl } of services) {
    //   await this.registerInstance(dubboServiceInterface, dubboServiceUrl)
    // }
  }

  // 注册服务消费
  async registerConsumers(consumers: RegisterConsumerService) {
    dlog("consumers => %O", consumers);
    // const dubboInterfaces = new Set<string>()
    // for (let { dubboServiceInterface, dubboServiceUrl } of consumers) {
    //   dubboInterfaces.add(dubboServiceInterface)
    //   await this.registerInstance(dubboServiceInterface, dubboServiceUrl)
    // }
    // await this.findDubboServiceUrls([...dubboInterfaces])
  }

  async registerInstance(dubboServiceInterface: string, dubboServiceUrl: string) {
    const metadata = {};
    const urlObj = new URL(dubboServiceUrl);
    dlog("urlObj => %O", urlObj);
    const { hostname: ip, port, searchParams } = urlObj;
    for (const key of searchParams.keys()) {
      metadata[key] = searchParams.get(key);
    }
    await this.client.registerInstance(dubboServiceInterface, {
      ip,
      port: port || 80,
      metadata
    });
  }

  close(): void {
    this.client?.close();
  }

  getClient() {
    return this.client;
  }

  /**
   * check nacos prop
   * @param props
   */
  private static checkProps(props: INaocsClientProps) {
    if (!props.connect) {
      throw new Error(`Please specify nacos props, connect is required`);
    }
    if (!(typeof props.connect === "string")) {
      throw new Error(`Please specify nacos props, connect should be a string`);
    }
    if (props.namespace && !(typeof props.namespace === "string")) {
      throw new Error(`Please specify nacos props, namespace should be a string`);
    }
    if (!props.logger) {
      throw new Error(`Please specify nacos props, logger is required`);
    }
  }
}

export function Nacos(props: INaocsClientProps) {
  return new NacosRegistry(props);
}
