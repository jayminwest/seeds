import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Attributes for custom task canceled events.
 */
export type CustomTaskCanceledAttributes = {
    /**
     * Unique identifier for the custom task within the workflow.
     */
    customTaskId: string;
    /**
     * The type/category of the custom task (e.g., 'llm_call', 'api_request').
     */
    customTaskType: string;
    /**
     * Optional reason provided for the cancellation.
     */
    reason?: string | null | undefined;
};
/** @internal */
export declare const CustomTaskCanceledAttributes$inboundSchema: z.ZodType<CustomTaskCanceledAttributes, unknown>;
export declare function customTaskCanceledAttributesFromJSON(jsonString: string): SafeParseResult<CustomTaskCanceledAttributes, SDKValidationError>;
//# sourceMappingURL=customtaskcanceledattributes.d.ts.map