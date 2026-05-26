import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ActivityTaskCompletedAttributesResponse } from "./activitytaskcompletedattributesresponse.js";
/**
 * Emitted when an activity task completes successfully.
 *
 * @remarks
 *
 * Contains timing information about the successful execution.
 */
export type ActivityTaskCompletedResponse = {
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
    eventType: "ACTIVITY_TASK_COMPLETED";
    /**
     * Attributes for activity task completed events.
     */
    attributes: ActivityTaskCompletedAttributesResponse;
};
/** @internal */
export declare const ActivityTaskCompletedResponse$inboundSchema: z.ZodType<ActivityTaskCompletedResponse, unknown>;
export declare function activityTaskCompletedResponseFromJSON(jsonString: string): SafeParseResult<ActivityTaskCompletedResponse, SDKValidationError>;
//# sourceMappingURL=activitytaskcompletedresponse.d.ts.map