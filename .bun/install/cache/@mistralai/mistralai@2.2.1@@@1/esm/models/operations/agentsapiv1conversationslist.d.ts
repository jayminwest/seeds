import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type AgentsApiV1ConversationsListRequest = {
    page?: number | undefined;
    pageSize?: number | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
};
export type AgentsApiV1ConversationsListResponse = components.ModelConversation | components.AgentConversation;
/** @internal */
export type AgentsApiV1ConversationsListRequest$Outbound = {
    page: number;
    page_size: number;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export declare const AgentsApiV1ConversationsListRequest$outboundSchema: z.ZodType<AgentsApiV1ConversationsListRequest$Outbound, AgentsApiV1ConversationsListRequest>;
export declare function agentsApiV1ConversationsListRequestToJSON(agentsApiV1ConversationsListRequest: AgentsApiV1ConversationsListRequest): string;
/** @internal */
export declare const AgentsApiV1ConversationsListResponse$inboundSchema: z.ZodType<AgentsApiV1ConversationsListResponse, unknown>;
export declare function agentsApiV1ConversationsListResponseFromJSON(jsonString: string): SafeParseResult<AgentsApiV1ConversationsListResponse, SDKValidationError>;
//# sourceMappingURL=agentsapiv1conversationslist.d.ts.map