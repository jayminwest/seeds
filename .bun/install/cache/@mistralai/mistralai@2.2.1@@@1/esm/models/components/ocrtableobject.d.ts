import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OCRConfidenceScore } from "./ocrconfidencescore.js";
/**
 * Format of the table
 */
export declare const Format: {
    readonly Markdown: "markdown";
    readonly Html: "html";
};
/**
 * Format of the table
 */
export type Format = OpenEnum<typeof Format>;
export type OCRTableObject = {
    /**
     * Table ID for extracted table in a page
     */
    id: string;
    /**
     * Content of the table in the given format
     */
    content: string;
    /**
     * Format of the table
     */
    format: Format;
    /**
     * Per-word confidence scores for the table content. Returned when confidence_scores_granularity is set to 'word'.
     */
    wordConfidenceScores?: Array<OCRConfidenceScore> | null | undefined;
};
/** @internal */
export declare const Format$inboundSchema: z.ZodType<Format, unknown>;
/** @internal */
export declare const OCRTableObject$inboundSchema: z.ZodType<OCRTableObject, unknown>;
export declare function ocrTableObjectFromJSON(jsonString: string): SafeParseResult<OCRTableObject, SDKValidationError>;
//# sourceMappingURL=ocrtableobject.d.ts.map