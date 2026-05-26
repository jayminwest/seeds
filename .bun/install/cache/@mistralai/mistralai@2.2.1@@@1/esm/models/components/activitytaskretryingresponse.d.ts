import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ActivityTaskRetryingAttributes } from "./activitytaskretryingattributes.js";
/**
 * Emitted when an activity task fails and will be retried.
 *
 * @remarks
 *
 * Contains information about the failed attempt and the error that occurred.
 */
export type ActivityTaskRetryingResponse = {
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
    eventType: "ACTIVITY_TASK_RETRYING";
    /**
     * Attributes for activity task retrying events.
     */
    attributes: ActivityTaskRetryingAttributes;
};
/** @internal */
export declare const ActivityTaskRetryingResponse$inboundSchema: z.ZodType<ActivityTaskRetryingResponse, unknown>;
export declare function activityTaskRetryingResponseFromJSON(jsonString: string): SafeParseResult<ActivityTaskRetryingResponse, SDKValidationError>;
//# sourceMappingURL=activitytaskretryingresponse.d.ts.map