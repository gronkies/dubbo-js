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

import { DubboClient } from "./dubbo-client";
import { DubboServer } from "./dubbo-server";
import { DubboRegistry } from "@apachedubbo/dubbo-registry";

export interface DubboOptions {
  application: { name: string };
  registry: DubboRegistry<Object>;
}

export class Dubbo {
  private readonly options: DubboOptions;

  constructor(option: DubboOptions) {
    this.options = option;
  }

  public newClient(): DubboClient {
    return new DubboClient(this.options);
  }

  public newServer(): DubboServer {
    return new DubboServer(this.options);
  }
}
