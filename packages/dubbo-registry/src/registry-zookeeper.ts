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

import ip from 'ip';
import debug from 'debug';
import qs from 'querystring';
import Zookeeper from 'zookeeper';
import type { IRegistry } from './registry';
import BaseRegistry from './registry-base';
import Timeout from './timeout';
import type { IDubboService, INodeProps, IZkClientConfig, RegisterConsumerService, IZkClientParams } from './types';

const dlog = debug('dubbo:zookeeper~');
const ipAddr = ip.address();
const DUBBO_ZK_ROOT_PATH: string = '/dubbo';

export class ZookeeperRegistry extends BaseRegistry implements IRegistry<Zookeeper> {
  private readonly props: IZkClientConfig;
  private client!: Zookeeper | null;
  private timeout: Timeout;

  private readonly readyPromise: Promise<void>;
  private resolve: Function | undefined;
  private reject: Function | undefined;

  constructor(props: IZkClientConfig) {
    super();
    dlog(`init zookeeper with %O`, props);
    ZookeeperRegistry.checkProps(props);
    this.props = props;

    this.props.zkRootPath = this.props.zkRootPath || DUBBO_ZK_ROOT_PATH;

    // init ready promise
    this.readyPromise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    this.timeout = new Timeout({
      maxTimeout: this.props.timeout || 40 * 1000,
      onTimeout: () => {
        this.reject && this.reject(new Error(`zookeeper connect ${this.props.connect} timeout`));
        this.close();
      }
    });
    this.init();
  }

  // ~~~~~~~~~~~~~~~~ private ~~~~~~~~~~~~~~~~~~~~~~~~~~
  private static checkProps(props: IZkClientConfig) {
    if (!props.connect) {
      throw new Error(`Please specify zookeeper connect url`);
    }
  }

  private init() {
    if (this.client) {
      return;
    }

    // set default props value
    this.props.timeout = this.props.timeout || 40 * 1000;
    this.props.debug_level = this.props.debug_level || Zookeeper.constants.ZOO_LOG_LEVEL_WARN;
    this.props.host_order_deterministic = this.props.host_order_deterministic || false;
    dlog('connecting zookeeper with %O', this.props);

    this.client = new Zookeeper(this.props);

    this.client.on('connect', async () => {
      dlog('connected with zookeeper with %s', this.props.connect);
      this.timeout.clearTimeout();

      try {
        if (this.props.zkRootPath) {
          // create root node
          await this.mkdirp(this.props.zkRootPath);
          // trigger ready promise
          this.resolve && this.resolve();
        }
      } catch (err) {
        this.reject && this.reject(err);
      }
    });

    this.client.on('close', () => {
      dlog(`zookeeper closed`);
      this.emitErr(new Error(`Zookeeper was closed`));
      this.close();
      this.init();
    });

    this.client.on('error', (err) => {
      dlog(`zookeeper error %s`, err);
      this.reject && this.reject(err);
      this.emitErr(err);
    });

    process.nextTick(() => {
      this.client?.init({});
    });
  }

  private async createNode(cfg: INodeProps) {
    dlog(`create zookeeper node %j`, cfg);
    const { path, data = '', isPersistent = false } = cfg;
    try {
      await this.client?.exists(path, false);
      dlog(`${path} node was existed ~`);
    } catch (err) {
      await this.client?.create(
        path,
        data,
        isPersistent ? Zookeeper.constants.ZOO_PERSISTENT : Zookeeper.constants.ZOO_EPHEMERAL
      );
    }
  }

  private async mkdirp(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client?.mkdirp(path, (err) => {
        if (err) {
          dlog(`mkdir %s error %s`, path, err);
          reject(err);
        } else {
          dlog('mkdir %s ok', path);
          resolve();
        }
      });
    });
  }

  private wrapWatch(dubboInterface: string) {
    const servicePath = `${this.props.zkRootPath}/${dubboInterface}/providers`;
    return async (type: number, state: number) => {
      dlog('wrapWatch %s %d %d', servicePath, type, state);
      await this.findDubboServiceUrl(dubboInterface);
      this.emitData(this.dubboServiceUrlMap);
    };
  }

  /**
   * build dubbo service url
   *
   * @param service
   * @returns
   */
  private buildUrl(
    meta: {
      application: { name: string };
      port: number;
      dubbo?: string;
    },
    service: IDubboService
  ) {
    const { dubboInterface, group, version, methods } = service;
    const methodName = Object.keys(methods).join();
    // build params
    const params: IZkClientParams = {
      interface: dubboInterface,
      methods: methodName,
      side: 'provider',
      pid: process.pid,
      protocol: 'dubbo',
      anyhost: true,
      timestamp: Date.now()
    };

    // dynamic params
    if (meta.application) {
      params['application'] = meta.application.name || 'node-dubbo-service';
    }
    if (meta.dubbo) {
      params['dubbo'] = meta.dubbo;
    }
    if (group && group !== '') {
      params['group'] = group;
    }
    if (version && version !== '0.0.0') {
      params['version'] = version;
    }

    return (
      `dubbo://${ipAddr}:${meta.port}/${dubboInterface}?` +
      qs.stringify(params, undefined, undefined, {
        encodeURIComponent: (str) => str
      })
    );
  }

  // ~~~~~~~~~~~~~~~~ public ~~~~~~~~~~~~~~~~~~~~~~~~~~

  getProps() {
    return this.props;
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  async findDubboServiceUrls(dubboInterfaces: Array<string>) {
    dlog('find dubbo service urls => %O', dubboInterfaces);
    await Promise.all(dubboInterfaces.map((dubboInterface) => this.findDubboServiceUrl(dubboInterface)));
    this.emitData(this.dubboServiceUrlMap);
  }

  async findDubboServiceUrl(dubboInterface: string) {
    const servicePath = `${this.props.zkRootPath}/${dubboInterface}/providers`;
    const urls = (
      this.client
        ? await this.client.w_get_children(servicePath, this.wrapWatch(dubboInterface)).catch((err) => {
            dlog(`get beehive service urls err %s %s %s`, servicePath, dubboInterface, err);
            return [];
          })
        : []
    )
      .map((v: string) => decodeURIComponent(v))
      .filter((v: string) => v.startsWith('dubbo://'));
    this.dubboServiceUrlMap.set(dubboInterface, urls);
  }

  async registerServices(meta: {
    application: { name: string };
    port: number;
    dubbo?: string;
    services: Array<IDubboService>;
  }) {
    // waiting status ready
    await this.ready();
    dlog(`registry dubbo service`);

    // register service
    for (let { dubboInterface, ...rest } of meta.services) {
      // create service root path
      const serviceRootPath = `${this.props.zkRootPath}/${dubboInterface}/providers`;
      await this.mkdirp(serviceRootPath);

      // create service node
      const dubboServiceUrl = this.buildUrl(meta, { dubboInterface, ...rest });
      dlog(`${serviceRootPath}/${dubboServiceUrl}`);

      // create service node
      await this.createNode({
        path: `${serviceRootPath}/${encodeURIComponent(dubboServiceUrl)}`
      });
    }
  }

  async registerConsumers(consumer: RegisterConsumerService) {
    dlog('registry consumers => %O', consumer);

    // waiting ready
    await this.ready();

    const dubboInterfaces = new Set<string>();
    const { application, services } = consumer;
    // registry consumer
    for (let { dubboInterface, timeout, group, version } of services) {
      // collection dubbo interface
      dubboInterfaces.add(dubboInterface);

      // build dubbo consumer url
      const dubboConsumerUrl = `consumer://${ipAddr}/${dubboInterface}?${qs.stringify({
        application: application.name,
        interface: dubboInterface,
        category: 'consumers',
        method: '',
        revision: version,
        version: version,
        group: group,
        timeout: timeout,
        side: 'consumer',
        check: false,
        pid: process.pid
      })}`;
      // create consumer root path
      const consumerRootPath = `${this.props.zkRootPath}/${dubboInterface}/consumers`;
      await this.mkdirp(consumerRootPath);
      // create dubbo consumer node
      await this.createNode({
        path: `${consumerRootPath}/${encodeURIComponent(dubboConsumerUrl)}`
      });
    }

    // find dubbo service urls
    await this.findDubboServiceUrls([...dubboInterfaces]);
  }

  close(): void {
    this.timeout.clearTimeout();
    this.client?.removeAllListeners();
    this.client?.close();
    this.client = null;
  }

  getClient() {
    return this.client;
  }
}

export function Zk(props: IZkClientConfig) {
  return new ZookeeperRegistry(props);
}
