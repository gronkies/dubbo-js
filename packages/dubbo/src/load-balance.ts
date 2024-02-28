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

type LoadBalanceOptions = {
  virtualNodes?: number;
};

class LoadBalance {
  // virtual nodes number, default value is 1
  private readonly virtualNodes: number;

  private hashRing: Map<number, string>;

  private dubboServices;

  constructor(options: LoadBalanceOptions) {
    this.virtualNodes = options.virtualNodes ? options.virtualNodes : 1;
    this.hashRing = new Map();
  }

  initDubboServices(dubboServices) {
    this.dubboServices = dubboServices;
    this.initWeight(dubboServices);
    this.initHashRing(dubboServices);
  }

  initWeight(dubboServices) {
    dubboServices.forEach((dubboService) => {
      if (!dubboService.weight) {
        dubboService.weight = 100;
      }
      dubboService.weight = Math.max(1, dubboService.weight);
      dubboService.currentWeight = 0;
    });
  }

  initHashRing(dubboServices) {}

  // calculate the hash corresponding to dubboUrl
  private calcHash(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      // Convert to 32bit integer
      hash |= 0;
    }
    return hash;
  }
}
