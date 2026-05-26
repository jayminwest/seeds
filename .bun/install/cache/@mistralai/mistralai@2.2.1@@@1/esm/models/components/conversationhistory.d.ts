import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { AgentHandoffEntry } from "./agenthandoffentry.js";
import { FunctionCallEntry } from "./functioncallentry.js";
import { FunctionResultEntry } from "./functionresultentry.js";
import { MessageInputEntry } from "./messageinputentry.js";
import { MessageOutputEntry } from "./messageoutputentry.js";
import { ToolExecutionEntry } from "./toolexecutionentry.js";
export type Entry = AgentHandoffEntry | FunctionCallEntry | MessageInputEntry | FunctionResultEntry | ToolExecutionEntry | MessageOutputEntry;
/**
 * Retrieve all entries in a conversation.
 */
export type ConversationHistory = {
    object: "conversation.history";
    conversationId: string;
    entries: Array<AgentHandoffEntry | FunctionCallEntry | MessageInputEntry | FunctionResultEntry | ToolExecutionEntry | MessageOutputEntry>;
};
/** @internal */
export declare const Entry$inboundSchema: z.ZodType<Entry, unknown>;
export declare function entryFromJSON(jsonString: string): SafeParseResult<Entry, SDKValidationError>;
/** @internal */
export declare const ConversationHistory$inboundSchema: z.ZodType<ConversationHistory, unknown>;
export declare function conversationHistoryFromJSON(jsonString: string): SafeParseResult<ConversationHistory, SDKValidationError>;
//# sourceMappingURL=conversationhistory.d.ts.map