import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { JSONPayloadResponse } from "./jsonpayloadresponse.js";
/**
 * Attributes for workflow execution continued-as-new events.
 */
export type WorkflowExecutionContinuedAsNewAttributesResponse = {
    /**
     * Unique identifier for the task within the workflow execution.
     */
    taskId: string;
    /**
     * The run ID of the new workflow execution that continues this workflow.
     */
    newExecutionRunId: string;
    /**
     * The registered name of the continued workflow.
     */
    workflowName: string;
    /**
     * A payload containing arbitrary JSON data.
     *
     * @remarks
     *
     * Used for complete state snapshots or final results.
     */
    input: JSONPayloadResponse;
};
/** @internal */
export declare const WorkflowExecutionContinuedAsNewAttributesResponse$inboundSchema: z.ZodType<WorkflowExecutionContinuedAsNewAttributesResponse, unknown>;
export declare function workflowExecutionContinuedAsNewAttributesResponseFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionContinuedAsNewAttributesResponse, SDKValidationError>;
//# sourceMappingURL=workflowexecutioncontinuedasnewattributesresponse.d.ts.map