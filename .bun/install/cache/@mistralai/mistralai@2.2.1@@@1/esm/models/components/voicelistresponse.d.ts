import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { VoiceResponse } from "./voiceresponse.js";
/**
 * Schema for voice list response
 */
export type VoiceListResponse = {
    items: Array<VoiceResponse>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};
/** @internal */
export declare const VoiceListResponse$inboundSchema: z.ZodType<VoiceListResponse, unknown>;
export declare function voiceListResponseFromJSON(jsonString: string): SafeParseResult<VoiceListResponse, SDKValidationError>;
//# sourceMappingURL=voicelistresponse.d.ts.map