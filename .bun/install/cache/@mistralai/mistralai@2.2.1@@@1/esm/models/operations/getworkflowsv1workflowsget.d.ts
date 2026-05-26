import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type GetWorkflowsV1WorkflowsGetRequest = {
    /**
     * Whether to only return active workflows
     */
    activeOnly?: boolean | undefined;
    /**
     * Whether to include shared workflows
     */
    includeShared?: boolean | undefined;
    /**
     * Whether to only return workflows available in chat assistant
     */
    availableInChatAssistant?: boolean | null | undefined;
    /**
     * Filter by archived state. False=exclude archived, True=only archived, None=include all
     */
    archived?: boolean | null | undefined;
    /**
     * The cursor for pagination
     */
    cursor?: string | null | undefined;
    /**
     * The maximum number of workflows to return
     */
    limit?: number | undefined;
};
export type GetWorkflowsV1WorkflowsGetResponse = {
    result: components.WorkflowListResponse;
};
/** @internal */
export type GetWorkflowsV1WorkflowsGetRequest$Outbound = {
    active_only: boolean;
    include_shared: boolean;
    available_in_chat_assistant?: boolean | null | undefined;
    archived?: boolean | null | undefined;
    cursor?: string | null | undefined;
    limit: number;
};
/** @internal */
export declare const GetWorkflowsV1WorkflowsGetRequest$outboundSchema: z.ZodType<GetWorkflowsV1WorkflowsGetRequest$Outbound, GetWorkflowsV1WorkflowsGetRequest>;
export declare function getWorkflowsV1WorkflowsGetRequestToJSON(getWorkflowsV1WorkflowsGetRequest: GetWorkflowsV1WorkflowsGetRequest): string;
/** @internal */
export declare const GetWorkflowsV1WorkflowsGetResponse$inboundSchema: z.ZodType<GetWorkflowsV1WorkflowsGetResponse, unknown>;
export declare function getWorkflowsV1WorkflowsGetResponseFromJSON(jsonString: string): SafeParseResult<GetWorkflowsV1WorkflowsGetResponse, SDKValidationError>;
//# sourceMappingURL=getworkflowsv1workflowsget.d.ts.map