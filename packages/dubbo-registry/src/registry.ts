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

import type {
  RegisterConsumerService,
  RegistrySubscriber,
  RegisterServicesMeta,
  DubboUrl,
  TypeName
} from "./types";

export interface DubboRegistry<T> {
  /**
   * waiting registry status ready
   */
  ready(): Promise<void>;

  /**
   * find dubbo service urls
   * @param dubboInterfaces
   */
  findDubboServiceUrls(dubboInterfaces: Array<string>): Promise<void>;

  /**
   * register dubbo service
   * @param meta
   */
  registerServices(meta: RegisterServicesMeta): Promise<void>;

  /**
   * register dubbo consumer
   * @param consumers
   */
  registerConsumers(consumers: RegisterConsumerService): Promise<void>;

  /**
   * close
   */
  close(): void;

  /**
   * get registry client such as zookeeper, nacos
   */
  getClient(): T | null;

  /**
   * Subscribe a callback function to handle service status changes.
   * @param cb - The callback function to subscribe.
   */
  subscribe(cb: RegistrySubscriber): this;

  /**
   * Unsubscribe a previously subscribed callback function.
   * @param cb - The callback function to unsubscribe.
   */
  unsubscribe(cb: RegistrySubscriber): this;

  /**
   * Emit service status change data to all subscribed callback functions.
   * @param map - A Map object representing the Dubbo interface and its corresponding URL list.
   */
  emitData(map: Map<TypeName, Array<DubboUrl>>): void;

  /**
   * Emit an error to all subscribed callback functions.
   * @param err - The error object to emit.
   */
  emitErr(err: Error): void;
}
