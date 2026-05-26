import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Failure } from "./failure.js";
/**
 * Attributes for activity task failed events (final failure after all retries).
 */
export type ActivityTaskFailedAttributes = {
    /**
     * Unique identifier for the activity task within the workflow.
     */
    taskId: string;
    /**
     * The registered name of the activity being executed.
     */
    activityName: string;
    /**
     * The final attempt number that failed (1-indexed).
     */
    attempt: number;
    /**
     * Represents an error or exception that occurred during execution.
     */
    failure: Failure;
};
/** @internal */
export declare const ActivityTaskFailedAttributes$inboundSchema: z.ZodType<ActivityTaskFailedAttributes, unknown>;
export declare function activityTaskFailedAttributesFromJSON(jsonString: string): SafeParseResult<ActivityTaskFailedAttributes, SDKValidationError>;
//# sourceMappingURL=activitytaskfailedattributes.d.ts.map