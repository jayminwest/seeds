import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Failure } from "./failure.js";
/**
 * Attributes for workflow execution failed events.
 */
export type WorkflowExecutionFailedAttributes = {
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
export declare const WorkflowExecutionFailedAttributes$inboundSchema: z.ZodType<WorkflowExecutionFailedAttributes, unknown>;
export declare function workflowExecutionFailedAttributesFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionFailedAttributes, SDKValidationError>;
//# sourceMappingURL=workflowexecutionfailedattributes.d.ts.map