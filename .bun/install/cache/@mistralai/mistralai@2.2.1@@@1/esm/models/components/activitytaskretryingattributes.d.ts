import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Failure } from "./failure.js";
/**
 * Attributes for activity task retrying events.
 */
export type ActivityTaskRetryingAttributes = {
    /**
     * Unique identifier for the activity task within the workflow.
     */
    taskId: string;
    /**
     * The registered name of the activity being executed.
     */
    activityName: string;
    /**
     * The attempt number that failed (1-indexed).
     */
    attempt: number;
    /**
     * Represents an error or exception that occurred during execution.
     */
    failure: Failure;
};
/** @internal */
export declare const ActivityTaskRetryingAttributes$inboundSchema: z.ZodType<ActivityTaskRetryingAttributes, unknown>;
export declare function activityTaskRetryingAttributesFromJSON(jsonString: string): SafeParseResult<ActivityTaskRetryingAttributes, SDKValidationError>;
//# sourceMappingURL=activitytaskretryingattributes.d.ts.map