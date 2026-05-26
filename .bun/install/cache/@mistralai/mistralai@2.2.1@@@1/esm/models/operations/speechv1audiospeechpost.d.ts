import * as z from "zod/v4";
import { EventStream } from "../../lib/event-streams.js";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type Data = components.SpeechStreamAudioDelta | components.SpeechStreamDone | discriminatedUnionTypes.Unknown<"type">;
/**
 * Speech audio data.
 */
export type SpeechStreamEvents = {
    event: components.SpeechStreamEventTypes;
    data: components.SpeechStreamAudioDelta | components.SpeechStreamDone | discriminatedUnionTypes.Unknown<"type">;
};
/**
 * Speech audio data.
 */
export type SpeechResponse = {
    /**
     * Base64 encoded audio data
     */
    audioData: string;
};
export type SpeechV1AudioSpeechPostResponse = SpeechResponse | EventStream<SpeechStreamEvents>;
/** @internal */
export declare const Data$inboundSchema: z.ZodType<Data, unknown>;
export declare function dataFromJSON(jsonString: string): SafeParseResult<Data, SDKValidationError>;
/** @internal */
export declare const SpeechStreamEvents$inboundSchema: z.ZodType<SpeechStreamEvents, unknown>;
export declare function speechStreamEventsFromJSON(jsonString: string): SafeParseResult<SpeechStreamEvents, SDKValidationError>;
/** @internal */
export declare const SpeechResponse$inboundSchema: z.ZodType<SpeechResponse, unknown>;
export declare function speechResponseFromJSON(jsonString: string): SafeParseResult<SpeechResponse, SDKValidationError>;
/** @internal */
export declare const SpeechV1AudioSpeechPostResponse$inboundSchema: z.ZodType<SpeechV1AudioSpeechPostResponse, unknown>;
export declare function speechV1AudioSpeechPostResponseFromJSON(jsonString: string): SafeParseResult<SpeechV1AudioSpeechPostResponse, SDKValidationError>;
//# sourceMappingURL=speechv1audiospeechpost.d.ts.map