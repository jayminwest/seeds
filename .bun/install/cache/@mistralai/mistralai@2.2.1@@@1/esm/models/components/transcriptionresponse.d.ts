import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { TranscriptionSegmentChunk } from "./transcriptionsegmentchunk.js";
import { UsageInfo } from "./usageinfo.js";
export type TranscriptionResponse = {
    model: string;
    text: string;
    segments?: Array<TranscriptionSegmentChunk> | undefined;
    usage: UsageInfo;
    language: string | null;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const TranscriptionResponse$inboundSchema: z.ZodType<TranscriptionResponse, unknown>;
export declare function transcriptionResponseFromJSON(jsonString: string): SafeParseResult<TranscriptionResponse, SDKValidationError>;
//# sourceMappingURL=transcriptionresponse.d.ts.map