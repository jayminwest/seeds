import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowExecutionStartedAttributesResponse } from "./workflowexecutionstartedattributesresponse.js";
/**
 * Emitted when a workflow execution begins.
 *
 * @remarks
 *
 * This is the first event in any workflow execution lifecycle.
 */
export type WorkflowExecutionStartedResponse = {
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
    eventType: "WORKFLOW_EXECUTION_STARTED";
    /**
     * Attributes for workflow execution started events.
     */
    attributes: WorkflowExecutionStartedAttributesResponse;
};
/** @internal */
export declare const WorkflowExecutionStartedResponse$inboundSchema: z.ZodType<WorkflowExecutionStartedResponse, unknown>;
export declare function workflowExecutionStartedResponseFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionStartedResponse, SDKValidationError>;
//# sourceMappingURL=workflowexecutionstartedresponse.d.ts.map