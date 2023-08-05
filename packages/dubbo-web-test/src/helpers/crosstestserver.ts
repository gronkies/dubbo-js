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

import { type Transport, createRouterTransport } from "apache-dubbo";
import {
  createDubboTransport,
  createGrpcWebTransport,
} from "apache-dubbo-web";
import { testRoutes } from "./test-routes.js";

// The following servers are available through crosstests:
//
// | server        | port |
// | ------------- | --- |
// | connect-go h1 | 8080 |
// | connect-go h2 | 8081 |
// | grpc-go       | 8083 |
//
// Source: // https://github.com/bufbuild/connect-es/pull/87
const crossTestDubboGoH1BaseUrl = "https://127.0.0.1:8080";

// see connect-node-h1-server.mjs
const connectNodeH1BaseUrl = "http://127.0.0.1:8085";

const crosstestTransports = {
  // gRPC-web
  "apache-dubbo-web (gRPC-web, binary) gRPC-web against connect-go (h1)": (
    options?: Record<string, unknown>
  ) =>
    createGrpcWebTransport({
      ...options,
      baseUrl: crossTestDubboGoH1BaseUrl,
      useBinaryFormat: true,
    }),
  "apache-dubbo-web (gRPC-web, JSON) gRPC-web against connect-go (h1)": (
    options?: Record<string, unknown>
  ) =>
    createGrpcWebTransport({
      ...options,
      baseUrl: crossTestDubboGoH1BaseUrl,
      useBinaryFormat: false,
    }),
  "apache-dubbo-web (gRPC-web, binary) gRPC-web against apache-dubbo-node (h1)":
    (options?: Record<string, unknown>) =>
      createGrpcWebTransport({
        ...options,
        baseUrl: connectNodeH1BaseUrl,
        useBinaryFormat: true,
      }),
  "apache-dubbo-web (gRPC-web, JSON) gRPC-web against apache-dubbo-node (h1)":
    (options?: Record<string, unknown>) =>
      createGrpcWebTransport({
        ...options,
        baseUrl: connectNodeH1BaseUrl,
        useBinaryFormat: false,
      }),
  // Triple
  "apache-dubbo-web (Triple, binary) against connect-go (h1)": (
    options?: Record<string, unknown>
  ) =>
    createDubboTransport({
      ...options,
      baseUrl: crossTestDubboGoH1BaseUrl,
      useBinaryFormat: true,
    }),
  "apache-dubbo-web (Triple, JSON) against connect-go (h1)": (
    options?: Record<string, unknown>
  ) =>
    createDubboTransport({
      ...options,
      baseUrl: crossTestDubboGoH1BaseUrl,
      useBinaryFormat: false,
    }),
  "apache-dubbo-web (Triple, binary) against apache-dubbo-node (h1)":
    (options?: Record<string, unknown>) =>
      createDubboTransport({
        ...options,
        baseUrl: connectNodeH1BaseUrl,
        useBinaryFormat: true,
      }),
  "apache-dubbo-web (Triple, JSON) against apache-dubbo-node (h1)": (
    options?: Record<string, unknown>
  ) =>
    createDubboTransport({
      ...options,
      baseUrl: connectNodeH1BaseUrl,
      useBinaryFormat: false,
    }),

  // DubboRouter
  "apache-dubbo-web (DubboRouter, binary)": (
    options?: Record<string, unknown>
  ) =>
    createRouterTransport(testRoutes, {
      transport: {
        ...options,
        useBinaryFormat: true,
      },
    }),

  "apache-dubbo-web (DubboRouter, JSON)": (
    options?: Record<string, unknown>
  ) =>
    createRouterTransport(testRoutes, {
      transport: {
        ...options,
        useBinaryFormat: false,
      },
    }),
};

export function describeTransports(
  specDefinitions: (
    transport: (options?: Record<string, unknown>) => Transport,
    transportName: keyof typeof crosstestTransports
  ) => void
) {
  for (const [name, transportFactory] of Object.entries(crosstestTransports)) {
    describe(name, () => {
      specDefinitions(
        transportFactory,
        name as keyof typeof crosstestTransports
      );
    });
  }
}

export function describeTransportsExcluding(
  exclude: Array<keyof typeof crosstestTransports>,
  specDefinitions: (
    transport: (options?: Record<string, unknown>) => Transport,
    transportName: keyof typeof crosstestTransports
  ) => void
) {
  for (const [name, transportFactory] of Object.entries(crosstestTransports)) {
    if (exclude.includes(name as keyof typeof crosstestTransports)) {
      continue;
    }
    describe(name, () => {
      specDefinitions(
        transportFactory,
        name as keyof typeof crosstestTransports
      );
    });
  }
}
