import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Response model for synchronous workflow execution
 */
export type WorkflowExecutionSyncResponse = {
    /**
     * Name of the workflow that was executed
     */
    workflowName: string;
    /**
     * ID of the workflow execution
     */
    executionId: string;
    /**
     * The result of the workflow execution
     */
    result: any;
};
/** @internal */
export declare const WorkflowExecutionSyncResponse$inboundSchema: z.ZodType<WorkflowExecutionSyncResponse, unknown>;
export declare function workflowExecutionSyncResponseFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionSyncResponse, SDKValidationError>;
//# sourceMappingURL=workflowexecutionsyncresponse.d.ts.map