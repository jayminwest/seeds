import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { RealtimeTranscriptionErrorDetail, RealtimeTranscriptionErrorDetail$Outbound } from "./realtimetranscriptionerrordetail.js";
export type RealtimeTranscriptionError = {
    type?: "error" | undefined;
    error: RealtimeTranscriptionErrorDetail;
};
/** @internal */
export declare const RealtimeTranscriptionError$inboundSchema: z.ZodType<RealtimeTranscriptionError, unknown>;
/** @internal */
export type RealtimeTranscriptionError$Outbound = {
    type: "error";
    error: RealtimeTranscriptionErrorDetail$Outbound;
};
/** @internal */
export declare const RealtimeTranscriptionError$outboundSchema: z.ZodType<RealtimeTranscriptionError$Outbound, RealtimeTranscriptionError>;
export declare function realtimeTranscriptionErrorToJSON(realtimeTranscriptionError: RealtimeTranscriptionError): string;
export declare function realtimeTranscriptionErrorFromJSON(jsonString: string): SafeParseResult<RealtimeTranscriptionError, SDKValidationError>;
//# sourceMappingURL=realtimetranscriptionerror.d.ts.map