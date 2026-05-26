import { MistralCore } from "../core.js";
import { EventStream } from "../lib/event-streams.js";
import { RequestOptions } from "../lib/sdks.js";
import { ConnectionError, InvalidRequestError, RequestAbortedError, RequestTimeoutError, UnexpectedClientError } from "../models/errors/httpclienterrors.js";
import * as errors from "../models/errors/index.js";
import { MistralError } from "../models/errors/mistralerror.js";
import { ResponseValidationError } from "../models/errors/responsevalidationerror.js";
import { SDKValidationError } from "../models/errors/sdkvalidationerror.js";
import * as operations from "../models/operations/index.js";
import { APIPromise } from "../types/async.js";
import { Result } from "../types/fp.js";
/**
 * Stream
 */
export declare function workflowsExecutionsStream(client: MistralCore, request: operations.StreamV1WorkflowsExecutionsExecutionIdStreamGetRequest, options?: RequestOptions): APIPromise<Result<EventStream<operations.StreamV1WorkflowsExecutionsExecutionIdStreamGetResponseBody>, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
//# sourceMappingURL=workflowsExecutionsStream.d.ts.map