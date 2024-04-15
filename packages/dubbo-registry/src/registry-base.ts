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
import type { RegistrySubscriber, TypeName, DubboUrl } from "./types";

const log = debug("registry:base~");

/**
 * Extract the base class of the registry
 */
export default class BaseRegistry {
  protected readonly subscribers: Set<RegistrySubscriber>;
  protected readonly dubboServiceUrlMap: Map<TypeName, Array<DubboUrl>>;

  constructor() {
    // Save the mapping relationship between the dubbo interface and the service URL
    this.dubboServiceUrlMap = new Map();
    this.subscribers = new Set();
  }

  subscribe(subscriber: RegistrySubscriber) {
    this.subscribers.add(subscriber);
    return this;
  }

  unsubscribe(subscriber: RegistrySubscriber) {
    this.subscribers.delete(subscriber);
    return this;
  }

  emitData(map: Map<TypeName, Array<DubboUrl>>) {
    log("emit data => %O", map);
    this.subscribers.forEach((s) => s.onChange(map));
  }

  emitErr(err: Error) {
    log("emit error %s", err);
    this.subscribers.forEach((s) => s.onError(err));
  }
}
