import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { AudioEncoding } from "./audioencoding.js";
export type AudioFormat = {
    encoding: AudioEncoding;
    sampleRate: number;
};
/** @internal */
export declare const AudioFormat$inboundSchema: z.ZodType<AudioFormat, unknown>;
/** @internal */
export type AudioFormat$Outbound = {
    encoding: string;
    sample_rate: number;
};
/** @internal */
export declare const AudioFormat$outboundSchema: z.ZodType<AudioFormat$Outbound, AudioFormat>;
export declare function audioFormatToJSON(audioFormat: AudioFormat): string;
export declare function audioFormatFromJSON(jsonString: string): SafeParseResult<AudioFormat, SDKValidationError>;
//# sourceMappingURL=audioformat.d.ts.map