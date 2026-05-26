import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ConversationUsageInfo = {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    connectorTokens?: number | null | undefined;
    connectors?: {
        [k: string]: number;
    } | null | undefined;
};
/** @internal */
export declare const ConversationUsageInfo$inboundSchema: z.ZodType<ConversationUsageInfo, unknown>;
export declare function conversationUsageInfoFromJSON(jsonString: string): SafeParseResult<ConversationUsageInfo, SDKValidationError>;
//# sourceMappingURL=conversationusageinfo.d.ts.map