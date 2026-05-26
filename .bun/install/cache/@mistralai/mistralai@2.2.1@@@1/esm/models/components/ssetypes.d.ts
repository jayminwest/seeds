import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
/**
 * Server side events sent when streaming a conversation response.
 */
export declare const SSETypes: {
    readonly ConversationResponseStarted: "conversation.response.started";
    readonly ConversationResponseDone: "conversation.response.done";
    readonly ConversationResponseError: "conversation.response.error";
    readonly MessageOutputDelta: "message.output.delta";
    readonly ToolExecutionStarted: "tool.execution.started";
    readonly ToolExecutionDelta: "tool.execution.delta";
    readonly ToolExecutionDone: "tool.execution.done";
    readonly AgentHandoffStarted: "agent.handoff.started";
    readonly AgentHandoffDone: "agent.handoff.done";
    readonly FunctionCallDelta: "function.call.delta";
};
/**
 * Server side events sent when streaming a conversation response.
 */
export type SSETypes = OpenEnum<typeof SSETypes>;
/** @internal */
export declare const SSETypes$inboundSchema: z.ZodType<SSETypes, unknown>;
//# sourceMappingURL=ssetypes.d.ts.map