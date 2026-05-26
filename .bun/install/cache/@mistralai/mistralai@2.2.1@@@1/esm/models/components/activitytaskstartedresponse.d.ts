import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ActivityTaskStartedAttributesResponse } from "./activitytaskstartedattributesresponse.js";
/**
 * Emitted when an activity task begins execution.
 *
 * @remarks
 *
 * This is the first event for an activity, emitted on the first attempt only.
 * Subsequent retry attempts emit ACTIVITY_TASK_RETRYING instead.
 */
export type ActivityTaskStartedResponse = {
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
    eventType: "ACTIVITY_TASK_STARTED";
    /**
     * Attributes for activity task started events.
     */
    attributes: ActivityTaskStartedAttributesResponse;
};
/** @internal */
export declare const ActivityTaskStartedResponse$inboundSchema: z.ZodType<ActivityTaskStartedResponse, unknown>;
export declare function activityTaskStartedResponseFromJSON(jsonString: string): SafeParseResult<ActivityTaskStartedResponse, SDKValidationError>;
//# sourceMappingURL=activitytaskstartedresponse.d.ts.map