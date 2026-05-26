import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { JSONPayloadResponse } from "./jsonpayloadresponse.js";
/**
 * Attributes for activity task completed events.
 */
export type ActivityTaskCompletedAttributesResponse = {
    /**
     * Unique identifier for the activity task within the workflow.
     */
    taskId: string;
    /**
     * The registered name of the activity being executed.
     */
    activityName: string;
    /**
     * A payload containing arbitrary JSON data.
     *
     * @remarks
     *
     * Used for complete state snapshots or final results.
     */
    result: JSONPayloadResponse;
};
/** @internal */
export declare const ActivityTaskCompletedAttributesResponse$inboundSchema: z.ZodType<ActivityTaskCompletedAttributesResponse, unknown>;
export declare function activityTaskCompletedAttributesResponseFromJSON(jsonString: string): SafeParseResult<ActivityTaskCompletedAttributesResponse, SDKValidationError>;
//# sourceMappingURL=activitytaskcompletedattributesresponse.d.ts.map