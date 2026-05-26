import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type TranscriptionStreamSegmentDelta = {
    type: "transcription.segment";
    text: string;
    start: number;
    end: number;
    speakerId?: string | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const TranscriptionStreamSegmentDelta$inboundSchema: z.ZodType<TranscriptionStreamSegmentDelta, unknown>;
export declare function transcriptionStreamSegmentDeltaFromJSON(jsonString: string): SafeParseResult<TranscriptionStreamSegmentDelta, SDKValidationError>;
//# sourceMappingURL=transcriptionstreamsegmentdelta.d.ts.map