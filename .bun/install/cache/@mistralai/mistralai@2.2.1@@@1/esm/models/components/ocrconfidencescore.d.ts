import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Confidence score for a token or word in OCR output.
 */
export type OCRConfidenceScore = {
    /**
     * The word or text segment
     */
    text: string;
    /**
     * Confidence score (0-1)
     */
    confidence: number;
    /**
     * Start index of the text in the page markdown string
     */
    startIndex: number;
};
/** @internal */
export declare const OCRConfidenceScore$inboundSchema: z.ZodType<OCRConfidenceScore, unknown>;
export declare function ocrConfidenceScoreFromJSON(jsonString: string): SafeParseResult<OCRConfidenceScore, SDKValidationError>;
//# sourceMappingURL=ocrconfidencescore.d.ts.map