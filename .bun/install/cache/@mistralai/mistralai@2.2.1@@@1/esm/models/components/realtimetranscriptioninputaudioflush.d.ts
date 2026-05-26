import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type RealtimeTranscriptionInputAudioFlush = {
    type?: "input_audio.flush" | undefined;
};
/** @internal */
export declare const RealtimeTranscriptionInputAudioFlush$inboundSchema: z.ZodType<RealtimeTranscriptionInputAudioFlush, unknown>;
/** @internal */
export type RealtimeTranscriptionInputAudioFlush$Outbound = {
    type: "input_audio.flush";
};
/** @internal */
export declare const RealtimeTranscriptionInputAudioFlush$outboundSchema: z.ZodType<RealtimeTranscriptionInputAudioFlush$Outbound, RealtimeTranscriptionInputAudioFlush>;
export declare function realtimeTranscriptionInputAudioFlushToJSON(realtimeTranscriptionInputAudioFlush: RealtimeTranscriptionInputAudioFlush): string;
export declare function realtimeTranscriptionInputAudioFlushFromJSON(jsonString: string): SafeParseResult<RealtimeTranscriptionInputAudioFlush, SDKValidationError>;
//# sourceMappingURL=realtimetranscriptioninputaudioflush.d.ts.map