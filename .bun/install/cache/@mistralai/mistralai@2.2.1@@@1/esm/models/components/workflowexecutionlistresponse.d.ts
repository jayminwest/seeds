import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowExecutionWithoutResultResponse } from "./workflowexecutionwithoutresultresponse.js";
/**
 * Deprecated: use WorkflowRunListResponse instead. Will be removed in the next major version.
 */
export type WorkflowExecutionListResponse = {
    /**
     * A list of workflow executions
     */
    executions: Array<WorkflowExecutionWithoutResultResponse>;
    /**
     * Token to use for fetching the next page of results. Null if this is the last page.
     */
    nextPageToken?: string | null | undefined;
};
/** @internal */
export declare const WorkflowExecutionListResponse$inboundSchema: z.ZodType<WorkflowExecutionListResponse, unknown>;
export declare function workflowExecutionListResponseFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionListResponse, SDKValidationError>;
//# sourceMappingURL=workflowexecutionlistresponse.d.ts.map