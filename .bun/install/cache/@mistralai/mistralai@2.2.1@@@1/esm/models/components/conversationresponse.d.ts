import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { AgentHandoffEntry } from "./agenthandoffentry.js";
import { ConversationUsageInfo } from "./conversationusageinfo.js";
import { FunctionCallEntry } from "./functioncallentry.js";
import { MessageOutputEntry } from "./messageoutputentry.js";
import { ToolExecutionEntry } from "./toolexecutionentry.js";
export type ConversationResponseOutput = AgentHandoffEntry | FunctionCallEntry | ToolExecutionEntry | MessageOutputEntry;
/**
 * The response after appending new entries to the conversation.
 */
export type ConversationResponse = {
    object: "conversation.response";
    conversationId: string;
    outputs: Array<AgentHandoffEntry | FunctionCallEntry | ToolExecutionEntry | MessageOutputEntry>;
    usage: ConversationUsageInfo;
    guardrails?: Array<{
        [k: string]: any;
    }> | null | undefined;
};
/** @internal */
export declare const ConversationResponseOutput$inboundSchema: z.ZodType<ConversationResponseOutput, unknown>;
export declare function conversationResponseOutputFromJSON(jsonString: string): SafeParseResult<ConversationResponseOutput, SDKValidationError>;
/** @internal */
export declare const ConversationResponse$inboundSchema: z.ZodType<ConversationResponse, unknown>;
export declare function conversationResponseFromJSON(jsonString: string): SafeParseResult<ConversationResponse, SDKValidationError>;
//# sourceMappingURL=conversationresponse.d.ts.map