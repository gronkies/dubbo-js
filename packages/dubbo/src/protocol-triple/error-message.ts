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

import { Code } from "../code.js";

/**
 * Returns Error Message for the given Connect code.
 * See https://cn.dubbo.apache.org/zh-cn/overview/reference/protocols/triple-spec/
 *
 * @private Internal code, does not follow semantic versioning.
 */
export function codeToErrorMessage(code: Code): string {
  switch (code) {
    case Code.Canceled:
      return ''; // Request Timeout
    case Code.Unknown:
      return ''; // Internal Server Error
    case Code.InvalidArgument:
      return ''; // Bad Request
    case Code.DeadlineExceeded:
      return ''; // Request Timeout
    case Code.NotFound:
      return ''; // Not Found
    case Code.AlreadyExists:
      return ''; // Conflict
    case Code.PermissionDenied:
      return ''; // Forbidden
    case Code.ResourceExhausted:
      return ''; // Too Many Requests
    case Code.FailedPrecondition:
      return ''; // Precondition Failed
    case Code.Aborted:
      return ''; // Conflict
    case Code.OutOfRange:
      return ''; // Bad Request
    case Code.Unimplemented:
      return ''; // Not Found
    case Code.Internal:
      return ''; // Internal Server Error
    case Code.Unavailable:
      return ''; // Service Unavailable
    case Code.DataLoss:
      return ''; // Internal Server Error
    case Code.Unauthenticated:
      return ''; // Unauthorized
    default:
      return ''; // same as CodeUnknown
  }
}
