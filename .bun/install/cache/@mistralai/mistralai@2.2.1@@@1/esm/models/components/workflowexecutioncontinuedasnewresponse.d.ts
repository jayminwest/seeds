import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowExecutionContinuedAsNewAttributesResponse } from "./workflowexecutioncontinuedasnewattributesresponse.js";
/**
 * Emitted when a workflow continues as a new execution.
 *
 * @remarks
 *
 * This occurs when a workflow uses continue-as-new to reset its history
 * while maintaining logical continuity.
 */
export type WorkflowExecutionContinuedAsNewResponse = {
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
    eventType: "WORKFLOW_EXECUTION_CONTINUED_AS_NEW";
    /**
     * Attributes for workflow execution continued-as-new events.
     */
    attributes: WorkflowExecutionContinuedAsNewAttributesResponse;
};
/** @internal */
export declare const WorkflowExecutionContinuedAsNewResponse$inboundSchema: z.ZodType<WorkflowExecutionContinuedAsNewResponse, unknown>;
export declare function workflowExecutionContinuedAsNewResponseFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionContinuedAsNewResponse, SDKValidationError>;
//# sourceMappingURL=workflowexecutioncontinuedasnewresponse.d.ts.map