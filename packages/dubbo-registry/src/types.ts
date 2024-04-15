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

export type TypeName = string;
export type DubboUrl = string;

export interface ITimeoutProps {
  maxTimeout?: number;
  onTimeout: () => void;
}

export interface INaocsClientProps {
  namespace?: string;
  connect: string;
  logger?: Console;
}
export interface RegistrySubscriber {
  onChange: (map: Map<TypeName, Array<DubboUrl>>) => void;
  onError: (err: Error) => void;
}

export interface IZkClientConfig {
  connect: string;
  timeout?: number;
  debug_level?: number;
  host_order_deterministic?: boolean;
  zkRootPath?: string;
}

export interface INodeProps {
  path: string;
  data?: Buffer | string;
  isPersistent?: boolean;
}

export interface DubboService {
  dubboInterface: string;
  path?: string;
  version?: string;
  timeout?: number;
  group?: string;
}

export interface RegisterServicesMeta {
  application: { name: string };
  port: number;
  dubbo?: string;
  services: Array<IDubboService>;
}

export interface RegisterConsumerService {
  application: { name: string };
  services: Array<DubboService>;
}

export interface IDubboService {
  dubboInterface: string;
  group?: string;
  version?: string;
  methods: { [key in string]: Function };
}

export interface IZkClientParams {
  interface: string;
  methods: string;
  side: string;
  pid: number;
  protocol: string;
  anyhost: boolean;
  timestamp: number;
  [key: string]:
    | string
    | number
    | boolean
    | readonly string[]
    | readonly number[]
    | readonly boolean[]
    | null;
}
