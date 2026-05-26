import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { CustomTaskCanceledAttributes } from "./customtaskcanceledattributes.js";
/**
 * Emitted when a custom task is canceled.
 *
 * @remarks
 *
 * Indicates the task was explicitly stopped before completion.
 */
export type CustomTaskCanceledResponse = {
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
    eventType: "CUSTOM_TASK_CANCELED";
    /**
     * Attributes for custom task canceled events.
     */
    attributes: CustomTaskCanceledAttributes;
};
/** @internal */
export declare const CustomTaskCanceledResponse$inboundSchema: z.ZodType<CustomTaskCanceledResponse, unknown>;
export declare function customTaskCanceledResponseFromJSON(jsonString: string): SafeParseResult<CustomTaskCanceledResponse, SDKValidationError>;
//# sourceMappingURL=customtaskcanceledresponse.d.ts.map