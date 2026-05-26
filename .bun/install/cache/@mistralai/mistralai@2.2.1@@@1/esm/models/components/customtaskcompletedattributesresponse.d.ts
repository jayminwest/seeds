import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { JSONPayloadResponse } from "./jsonpayloadresponse.js";
/**
 * Attributes for custom task completed events.
 */
export type CustomTaskCompletedAttributesResponse = {
    /**
     * Unique identifier for the custom task within the workflow.
     */
    customTaskId: string;
    /**
     * The type/category of the custom task (e.g., 'llm_call', 'api_request').
     */
    customTaskType: string;
    /**
     * A payload containing arbitrary JSON data.
     *
     * @remarks
     *
     * Used for complete state snapshots or final results.
     */
    payload: JSONPayloadResponse;
};
/** @internal */
export declare const CustomTaskCompletedAttributesResponse$inboundSchema: z.ZodType<CustomTaskCompletedAttributesResponse, unknown>;
export declare function customTaskCompletedAttributesResponseFromJSON(jsonString: string): SafeParseResult<CustomTaskCompletedAttributesResponse, SDKValidationError>;
//# sourceMappingURL=customtaskcompletedattributesresponse.d.ts.map