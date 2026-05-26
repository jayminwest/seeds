import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type AudioChunk = {
    type: "input_audio";
    inputAudio: string;
};
/** @internal */
export declare const AudioChunk$inboundSchema: z.ZodType<AudioChunk, unknown>;
/** @internal */
export type AudioChunk$Outbound = {
    type: "input_audio";
    input_audio: string;
};
/** @internal */
export declare const AudioChunk$outboundSchema: z.ZodType<AudioChunk$Outbound, AudioChunk>;
export declare function audioChunkToJSON(audioChunk: AudioChunk): string;
export declare function audioChunkFromJSON(jsonString: string): SafeParseResult<AudioChunk, SDKValidationError>;
//# sourceMappingURL=audiochunk.d.ts.map