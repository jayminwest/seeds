import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowTaskFailedAttributes } from "./workflowtaskfailedattributes.js";
/**
 * Emitted when a workflow task fails.
 *
 * @remarks
 *
 * This indicates an error occurred during workflow task execution,
 * which may trigger a retry depending on configuration.
 */
export type WorkflowTaskFailedResponse = {
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
    eventType: "WORKFLOW_TASK_FAILED";
    /**
     * Attributes for workflow task failed events.
     */
    attributes: WorkflowTaskFailedAttributes;
};
/** @internal */
export declare const WorkflowTaskFailedResponse$inboundSchema: z.ZodType<WorkflowTaskFailedResponse, unknown>;
export declare function workflowTaskFailedResponseFromJSON(jsonString: string): SafeParseResult<WorkflowTaskFailedResponse, SDKValidationError>;
//# sourceMappingURL=workflowtaskfailedresponse.d.ts.map