import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Schema for voice response
 */
export type VoiceResponse = {
    name: string;
    slug?: string | null | undefined;
    languages?: Array<string> | undefined;
    gender?: string | null | undefined;
    age?: number | null | undefined;
    tags?: Array<string> | null | undefined;
    color?: string | null | undefined;
    retentionNotice: number;
    id: string;
    createdAt: Date;
    userId: string | null;
};
/** @internal */
export declare const VoiceResponse$inboundSchema: z.ZodType<VoiceResponse, unknown>;
export declare function voiceResponseFromJSON(jsonString: string): SafeParseResult<VoiceResponse, SDKValidationError>;
//# sourceMappingURL=voiceresponse.d.ts.map