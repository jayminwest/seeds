import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Failure } from "./failure.js";
/**
 * Attributes for workflow task failed events.
 */
export type WorkflowTaskFailedAttributes = {
    /**
     * Unique identifier for the task within the workflow execution.
     */
    taskId: string;
    /**
     * Represents an error or exception that occurred during execution.
     */
    failure: Failure;
};
/** @internal */
export declare const WorkflowTaskFailedAttributes$inboundSchema: z.ZodType<WorkflowTaskFailedAttributes, unknown>;
export declare function workflowTaskFailedAttributesFromJSON(jsonString: string): SafeParseResult<WorkflowTaskFailedAttributes, SDKValidationError>;
//# sourceMappingURL=workflowtaskfailedattributes.d.ts.map