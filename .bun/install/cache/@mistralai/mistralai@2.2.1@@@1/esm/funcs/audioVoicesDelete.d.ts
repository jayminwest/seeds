import { MistralCore } from "../core.js";
import { RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import { ConnectionError, InvalidRequestError, RequestAbortedError, RequestTimeoutError, UnexpectedClientError } from "../models/errors/httpclienterrors.js";
import * as errors from "../models/errors/index.js";
import { MistralError } from "../models/errors/mistralerror.js";
import { ResponseValidationError } from "../models/errors/responsevalidationerror.js";
import { SDKValidationError } from "../models/errors/sdkvalidationerror.js";
import * as operations from "../models/operations/index.js";
import { APIPromise } from "../types/async.js";
import { Result } from "../types/fp.js";
/**
 * Delete a custom voice
 *
 * @remarks
 * Delete a custom voice
 */
export declare function audioVoicesDelete(client: MistralCore, request: operations.DeleteVoiceV1AudioVoicesVoiceIdDeleteRequest, options?: RequestOptions): APIPromise<Result<components.VoiceResponse, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
//# sourceMappingURL=audioVoicesDelete.d.ts.map