import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Attributes for custom task timed out events.
 */
export type CustomTaskTimedOutAttributes = {
    /**
     * Unique identifier for the custom task within the workflow.
     */
    customTaskId: string;
    /**
     * The type/category of the custom task (e.g., 'llm_call', 'api_request').
     */
    customTaskType: string;
    /**
     * The type of timeout that occurred.
     */
    timeoutType?: string | null | undefined;
};
/** @internal */
export declare const CustomTaskTimedOutAttributes$inboundSchema: z.ZodType<CustomTaskTimedOutAttributes, unknown>;
export declare function customTaskTimedOutAttributesFromJSON(jsonString: string): SafeParseResult<CustomTaskTimedOutAttributes, SDKValidationError>;
//# sourceMappingURL=customtasktimedoutattributes.d.ts.map