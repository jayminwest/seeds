import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type TranscriptionStreamLanguage = {
    type: "transcription.language";
    audioLanguage: string;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const TranscriptionStreamLanguage$inboundSchema: z.ZodType<TranscriptionStreamLanguage, unknown>;
/** @internal */
export type TranscriptionStreamLanguage$Outbound = {
    type: "transcription.language";
    audio_language: string;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const TranscriptionStreamLanguage$outboundSchema: z.ZodType<TranscriptionStreamLanguage$Outbound, TranscriptionStreamLanguage>;
export declare function transcriptionStreamLanguageToJSON(transcriptionStreamLanguage: TranscriptionStreamLanguage): string;
export declare function transcriptionStreamLanguageFromJSON(jsonString: string): SafeParseResult<TranscriptionStreamLanguage, SDKValidationError>;
//# sourceMappingURL=transcriptionstreamlanguage.d.ts.map