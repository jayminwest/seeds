import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Failure } from "./failure.js";
/**
 * Attributes for custom task failed events.
 */
export type CustomTaskFailedAttributes = {
    /**
     * Unique identifier for the custom task within the workflow.
     */
    customTaskId: string;
    /**
     * The type/category of the custom task (e.g., 'llm_call', 'api_request').
     */
    customTaskType: string;
    /**
     * Represents an error or exception that occurred during execution.
     */
    failure: Failure;
};
/** @internal */
export declare const CustomTaskFailedAttributes$inboundSchema: z.ZodType<CustomTaskFailedAttributes, unknown>;
export declare function customTaskFailedAttributesFromJSON(jsonString: string): SafeParseResult<CustomTaskFailedAttributes, SDKValidationError>;
//# sourceMappingURL=customtaskfailedattributes.d.ts.map