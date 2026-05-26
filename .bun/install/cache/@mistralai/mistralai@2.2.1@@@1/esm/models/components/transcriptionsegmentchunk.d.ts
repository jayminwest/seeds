import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type TranscriptionSegmentChunk = {
    type?: "transcription_segment" | undefined;
    text: string;
    start: number;
    end: number;
    score?: number | null | undefined;
    speakerId?: string | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const TranscriptionSegmentChunk$inboundSchema: z.ZodType<TranscriptionSegmentChunk, unknown>;
/** @internal */
export type TranscriptionSegmentChunk$Outbound = {
    type: "transcription_segment";
    text: string;
    start: number;
    end: number;
    score?: number | null | undefined;
    speaker_id?: string | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const TranscriptionSegmentChunk$outboundSchema: z.ZodType<TranscriptionSegmentChunk$Outbound, TranscriptionSegmentChunk>;
export declare function transcriptionSegmentChunkToJSON(transcriptionSegmentChunk: TranscriptionSegmentChunk): string;
export declare function transcriptionSegmentChunkFromJSON(jsonString: string): SafeParseResult<TranscriptionSegmentChunk, SDKValidationError>;
//# sourceMappingURL=transcriptionsegmentchunk.d.ts.map