import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Attributes for workflow task timed out events.
 */
export type WorkflowTaskTimedOutAttributes = {
    /**
     * Unique identifier for the task within the workflow execution.
     */
    taskId: string;
    /**
     * The type of timeout that occurred (e.g., 'START_TO_CLOSE', 'SCHEDULE_TO_START').
     */
    timeoutType?: string | null | undefined;
};
/** @internal */
export declare const WorkflowTaskTimedOutAttributes$inboundSchema: z.ZodType<WorkflowTaskTimedOutAttributes, unknown>;
export declare function workflowTaskTimedOutAttributesFromJSON(jsonString: string): SafeParseResult<WorkflowTaskTimedOutAttributes, SDKValidationError>;
//# sourceMappingURL=workflowtasktimedoutattributes.d.ts.map