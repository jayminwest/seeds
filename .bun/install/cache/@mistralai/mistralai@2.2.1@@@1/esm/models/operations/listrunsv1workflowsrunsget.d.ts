import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Filter by workflow status
 */
export type ListRunsV1WorkflowsRunsGetStatus = components.WorkflowExecutionStatus | Array<components.WorkflowExecutionStatus>;
export type ListRunsV1WorkflowsRunsGetRequest = {
    /**
     * Filter by workflow name or id
     */
    workflowIdentifier?: string | null | undefined;
    /**
     * Search by workflow name, display name or id
     */
    search?: string | null | undefined;
    /**
     * Filter by workflow status
     */
    status?: components.WorkflowExecutionStatus | Array<components.WorkflowExecutionStatus> | null | undefined;
    /**
     * Filter by user id. Use 'current' to filter by the authenticated user
     */
    userId?: string | null | undefined;
    /**
     * Number of items per page
     */
    pageSize?: number | undefined;
    /**
     * Token for the next page of results
     */
    nextPageToken?: string | null | undefined;
};
export type ListRunsV1WorkflowsRunsGetResponse = {
    result: components.WorkflowExecutionListResponse;
};
/** @internal */
export type ListRunsV1WorkflowsRunsGetStatus$Outbound = string | Array<string>;
/** @internal */
export declare const ListRunsV1WorkflowsRunsGetStatus$outboundSchema: z.ZodType<ListRunsV1WorkflowsRunsGetStatus$Outbound, ListRunsV1WorkflowsRunsGetStatus>;
export declare function listRunsV1WorkflowsRunsGetStatusToJSON(listRunsV1WorkflowsRunsGetStatus: ListRunsV1WorkflowsRunsGetStatus): string;
/** @internal */
export type ListRunsV1WorkflowsRunsGetRequest$Outbound = {
    workflow_identifier?: string | null | undefined;
    search?: string | null | undefined;
    status?: string | Array<string> | null | undefined;
    user_id?: string | null | undefined;
    page_size: number;
    next_page_token?: string | null | undefined;
};
/** @internal */
export declare const ListRunsV1WorkflowsRunsGetRequest$outboundSchema: z.ZodType<ListRunsV1WorkflowsRunsGetRequest$Outbound, ListRunsV1WorkflowsRunsGetRequest>;
export declare function listRunsV1WorkflowsRunsGetRequestToJSON(listRunsV1WorkflowsRunsGetRequest: ListRunsV1WorkflowsRunsGetRequest): string;
/** @internal */
export declare const ListRunsV1WorkflowsRunsGetResponse$inboundSchema: z.ZodType<ListRunsV1WorkflowsRunsGetResponse, unknown>;
export declare function listRunsV1WorkflowsRunsGetResponseFromJSON(jsonString: string): SafeParseResult<ListRunsV1WorkflowsRunsGetResponse, SDKValidationError>;
//# sourceMappingURL=listrunsv1workflowsrunsget.d.ts.map