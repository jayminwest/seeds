import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { JSONPayloadResponse } from "./jsonpayloadresponse.js";
/**
 * Attributes for activity task started events.
 */
export type ActivityTaskStartedAttributesResponse = {
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
    input: JSONPayloadResponse;
};
/** @internal */
export declare const ActivityTaskStartedAttributesResponse$inboundSchema: z.ZodType<ActivityTaskStartedAttributesResponse, unknown>;
export declare function activityTaskStartedAttributesResponseFromJSON(jsonString: string): SafeParseResult<ActivityTaskStartedAttributesResponse, SDKValidationError>;
//# sourceMappingURL=activitytaskstartedattributesresponse.d.ts.map