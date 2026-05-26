import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowExecutionFailedAttributes } from "./workflowexecutionfailedattributes.js";
/**
 * Emitted when a workflow execution fails due to an unhandled exception.
 *
 * @remarks
 *
 * This is a terminal event indicating the workflow ended with an error.
 */
export type WorkflowExecutionFailedResponse = {
    /**
     * Unique identifier for this event instance.
     */
    eventId: string;
    /**
     * Unix timestamp in nanoseconds when the event was created.
     */
    eventTimestamp: number;
    /**
     * Execution ID of the root workflow that initiated this execution chain.
     */
    rootWorkflowExecId: string;
    /**
     * Execution ID of the parent workflow that initiated this execution. If this is a root workflow, this field is not set.
     */
    parentWorkflowExecId: string | null;
    /**
     * Execution ID of the workflow that emitted this event.
     */
    workflowExecId: string;
    /**
     * Run ID of the workflow execution. Changes on continue-as-new while workflow_exec_id stays the same.
     */
    workflowRunId: string;
    /**
     * The registered name of the workflow that emitted this event.
     */
    workflowName: string;
    /**
     * Event type discriminator.
     */
    eventType: "WORKFLOW_EXECUTION_FAILED";
    /**
     * Attributes for workflow execution failed events.
     */
    attributes: WorkflowExecutionFailedAttributes;
};
/** @internal */
export declare const WorkflowExecutionFailedResponse$inboundSchema: z.ZodType<WorkflowExecutionFailedResponse, unknown>;
export declare function workflowExecutionFailedResponseFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionFailedResponse, SDKValidationError>;
//# sourceMappingURL=workflowexecutionfailedresponse.d.ts.map