import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { CustomTaskCompletedAttributesResponse } from "./customtaskcompletedattributesresponse.js";
/**
 * Emitted when a custom task completes successfully.
 *
 * @remarks
 *
 * Contains the final result of the task execution.
 */
export type CustomTaskCompletedResponse = {
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
    eventType: "CUSTOM_TASK_COMPLETED";
    /**
     * Attributes for custom task completed events.
     */
    attributes: CustomTaskCompletedAttributesResponse;
};
/** @internal */
export declare const CustomTaskCompletedResponse$inboundSchema: z.ZodType<CustomTaskCompletedResponse, unknown>;
export declare function customTaskCompletedResponseFromJSON(jsonString: string): SafeParseResult<CustomTaskCompletedResponse, SDKValidationError>;
//# sourceMappingURL=customtaskcompletedresponse.d.ts.map