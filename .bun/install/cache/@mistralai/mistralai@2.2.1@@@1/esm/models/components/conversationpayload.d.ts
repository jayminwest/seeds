import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ConversationPayload = {
    messages: Array<{
        [k: string]: any;
    }>;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const ConversationPayload$inboundSchema: z.ZodType<ConversationPayload, unknown>;
/** @internal */
export type ConversationPayload$Outbound = {
    messages: Array<{
        [k: string]: any;
    }>;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const ConversationPayload$outboundSchema: z.ZodType<ConversationPayload$Outbound, ConversationPayload>;
export declare function conversationPayloadToJSON(conversationPayload: ConversationPayload): string;
export declare function conversationPayloadFromJSON(jsonString: string): SafeParseResult<ConversationPayload, SDKValidationError>;
//# sourceMappingURL=conversationpayload.d.ts.map