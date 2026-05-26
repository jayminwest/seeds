import * as z from "zod/v4";
import * as components from "../components/index.js";
export type AgentsApiV1ConversationsAppendRequest = {
    /**
     * ID of the conversation to which we append entries.
     */
    conversationId: string;
    conversationAppendRequest: components.ConversationAppendRequest;
};
/** @internal */
export type AgentsApiV1ConversationsAppendRequest$Outbound = {
    conversation_id: string;
    ConversationAppendRequest: components.ConversationAppendRequest$Outbound;
};
/** @internal */
export declare const AgentsApiV1ConversationsAppendRequest$outboundSchema: z.ZodType<AgentsApiV1ConversationsAppendRequest$Outbound, AgentsApiV1ConversationsAppendRequest>;
export declare function agentsApiV1ConversationsAppendRequestToJSON(agentsApiV1ConversationsAppendRequest: AgentsApiV1ConversationsAppendRequest): string;
//# sourceMappingURL=agentsapiv1conversationsappend.d.ts.map