import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ChatTranscriptionEvent = {
    audioUrl: string;
    model: string;
    responseMessage: {
        [k: string]: any;
    };
};
/** @internal */
export declare const ChatTranscriptionEvent$inboundSchema: z.ZodType<ChatTranscriptionEvent, unknown>;
export declare function chatTranscriptionEventFromJSON(jsonString: string): SafeParseResult<ChatTranscriptionEvent, SDKValidationError>;
//# sourceMappingURL=chattranscriptionevent.d.ts.map