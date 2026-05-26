import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Human-readable error message.
 */
export type RealtimeTranscriptionErrorDetailMessage = string | {
    [k: string]: any;
};
export type RealtimeTranscriptionErrorDetail = {
    /**
     * Human-readable error message.
     */
    message: string | {
        [k: string]: any;
    };
    /**
     * Internal error code for debugging.
     */
    code: number;
};
/** @internal */
export declare const RealtimeTranscriptionErrorDetailMessage$inboundSchema: z.ZodType<RealtimeTranscriptionErrorDetailMessage, unknown>;
/** @internal */
export type RealtimeTranscriptionErrorDetailMessage$Outbound = string | {
    [k: string]: any;
};
/** @internal */
export declare const RealtimeTranscriptionErrorDetailMessage$outboundSchema: z.ZodType<RealtimeTranscriptionErrorDetailMessage$Outbound, RealtimeTranscriptionErrorDetailMessage>;
export declare function realtimeTranscriptionErrorDetailMessageToJSON(realtimeTranscriptionErrorDetailMessage: RealtimeTranscriptionErrorDetailMessage): string;
export declare function realtimeTranscriptionErrorDetailMessageFromJSON(jsonString: string): SafeParseResult<RealtimeTranscriptionErrorDetailMessage, SDKValidationError>;
/** @internal */
export declare const RealtimeTranscriptionErrorDetail$inboundSchema: z.ZodType<RealtimeTranscriptionErrorDetail, unknown>;
/** @internal */
export type RealtimeTranscriptionErrorDetail$Outbound = {
    message: string | {
        [k: string]: any;
    };
    code: number;
};
/** @internal */
export declare const RealtimeTranscriptionErrorDetail$outboundSchema: z.ZodType<RealtimeTranscriptionErrorDetail$Outbound, RealtimeTranscriptionErrorDetail>;
export declare function realtimeTranscriptionErrorDetailToJSON(realtimeTranscriptionErrorDetail: RealtimeTranscriptionErrorDetail): string;
export declare function realtimeTranscriptionErrorDetailFromJSON(jsonString: string): SafeParseResult<RealtimeTranscriptionErrorDetail, SDKValidationError>;
//# sourceMappingURL=realtimetranscriptionerrordetail.d.ts.map