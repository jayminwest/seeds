import { MistralCore } from "../core.js";
import { EventStream } from "../lib/event-streams.js";
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
export declare enum CompleteAcceptEnum {
    applicationJson = "application/json",
    textEventStream = "text/event-stream"
}
/**
 * Speech
 */
export declare function audioSpeechComplete(client: MistralCore, request: components.SpeechRequest & {
    stream?: false;
}, options?: RequestOptions & {
    acceptHeaderOverride?: CompleteAcceptEnum;
}): APIPromise<Result<operations.SpeechResponse, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
export declare function audioSpeechComplete(client: MistralCore, request: components.SpeechRequest & {
    stream: true;
}, options?: RequestOptions & {
    acceptHeaderOverride?: CompleteAcceptEnum;
}): APIPromise<Result<EventStream<operations.SpeechStreamEvents>, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
export declare function audioSpeechComplete(client: MistralCore, request: components.SpeechRequest, options?: RequestOptions & {
    acceptHeaderOverride?: CompleteAcceptEnum;
}): APIPromise<Result<operations.SpeechV1AudioSpeechPostResponse, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
//# sourceMappingURL=audioSpeechComplete.d.ts.map