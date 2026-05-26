import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { JSONPayloadResponse } from "./jsonpayloadresponse.js";
/**
 * Attributes for custom task started events.
 */
export type CustomTaskStartedAttributesResponse = {
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
    payload?: JSONPayloadResponse | undefined;
};
/** @internal */
export declare const CustomTaskStartedAttributesResponse$inboundSchema: z.ZodType<CustomTaskStartedAttributesResponse, unknown>;
export declare function customTaskStartedAttributesResponseFromJSON(jsonString: string): SafeParseResult<CustomTaskStartedAttributesResponse, SDKValidationError>;
//# sourceMappingURL=customtaskstartedattributesresponse.d.ts.map