import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type AgentsApiV1ConversationsGetRequest = {
    /**
     * ID of the conversation from which we are fetching metadata.
     */
    conversationId: string;
};
/**
 * Successful Response
 */
export type ResponseV1ConversationsGet = components.ModelConversation | components.AgentConversation;
/** @internal */
export type AgentsApiV1ConversationsGetRequest$Outbound = {
    conversation_id: string;
};
/** @internal */
export declare const AgentsApiV1ConversationsGetRequest$outboundSchema: z.ZodType<AgentsApiV1ConversationsGetRequest$Outbound, AgentsApiV1ConversationsGetRequest>;
export declare function agentsApiV1ConversationsGetRequestToJSON(agentsApiV1ConversationsGetRequest: AgentsApiV1ConversationsGetRequest): string;
/** @internal */
export declare const ResponseV1ConversationsGet$inboundSchema: z.ZodType<ResponseV1ConversationsGet, unknown>;
export declare function responseV1ConversationsGetFromJSON(jsonString: string): SafeParseResult<ResponseV1ConversationsGet, SDKValidationError>;
//# sourceMappingURL=agentsapiv1conversationsget.d.ts.map