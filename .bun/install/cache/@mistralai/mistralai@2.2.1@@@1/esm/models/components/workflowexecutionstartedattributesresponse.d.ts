import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { JSONPayloadResponse } from "./jsonpayloadresponse.js";
/**
 * Attributes for workflow execution started events.
 */
export type WorkflowExecutionStartedAttributesResponse = {
    /**
     * Unique identifier for the task within the workflow execution.
     */
    taskId: string;
    /**
     * The registered name of the workflow being executed.
     */
    workflowName: string;
    /**
     * The user-friendly display name of the workflow, if available.
     */
    displayName?: string | null | undefined;
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
export declare const WorkflowExecutionStartedAttributesResponse$inboundSchema: z.ZodType<WorkflowExecutionStartedAttributesResponse, unknown>;
export declare function workflowExecutionStartedAttributesResponseFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionStartedAttributesResponse, SDKValidationError>;
//# sourceMappingURL=workflowexecutionstartedattributesresponse.d.ts.map