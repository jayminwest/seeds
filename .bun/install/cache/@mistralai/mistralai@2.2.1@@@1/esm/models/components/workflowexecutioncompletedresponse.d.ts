import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowExecutionCompletedAttributesResponse } from "./workflowexecutioncompletedattributesresponse.js";
/**
 * Emitted when a workflow execution completes successfully.
 *
 * @remarks
 *
 * This is a terminal event indicating the workflow finished without errors.
 */
export type WorkflowExecutionCompletedResponse = {
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
    eventType: "WORKFLOW_EXECUTION_COMPLETED";
    /**
     * Attributes for workflow execution completed events.
     */
    attributes: WorkflowExecutionCompletedAttributesResponse;
};
/** @internal */
export declare const WorkflowExecutionCompletedResponse$inboundSchema: z.ZodType<WorkflowExecutionCompletedResponse, unknown>;
export declare function workflowExecutionCompletedResponseFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionCompletedResponse, SDKValidationError>;
//# sourceMappingURL=workflowexecutioncompletedresponse.d.ts.map