import * as z from "zod/v4";
import { NetworkEncodedInput, NetworkEncodedInput$Outbound } from "./networkencodedinput.js";
export type WorkflowExecutionRequest = {
    /**
     * Allows you to specify a custom execution ID. If not provided, a random ID will be generated.
     */
    executionId?: string | null | undefined;
    /**
     * The input to the workflow. This should be a dictionary or a BaseModel that matches the workflow's input schema.
     */
    input?: any | null | undefined;
    /**
     * Encoded input to the workflow, used when payload encoding is enabled.
     */
    encodedInput?: NetworkEncodedInput | null | undefined;
    /**
     * If true, wait for the workflow to complete and return the result directly.
     */
    waitForResult?: boolean | undefined;
    /**
     * Maximum time to wait for completion when wait_for_result is true.
     */
    timeoutSeconds?: number | null | undefined;
    customTracingAttributes?: {
        [k: string]: string;
    } | null | undefined;
    /**
     * Plugin-specific data to propagate into WorkflowContext.extensions at execution time.
     */
    extensions?: {
        [k: string]: any;
    } | null | undefined;
    /**
     * Deprecated. Use deployment_name instead.
     *
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    taskQueue?: string | null | undefined;
    /**
     * Name of the deployment to route this execution to
     */
    deploymentName?: string | null | undefined;
};
/** @internal */
export type WorkflowExecutionRequest$Outbound = {
    execution_id?: string | null | undefined;
    input?: any | null | undefined;
    encoded_input?: NetworkEncodedInput$Outbound | null | undefined;
    wait_for_result: boolean;
    timeout_seconds?: number | null | undefined;
    custom_tracing_attributes?: {
        [k: string]: string;
    } | null | undefined;
    extensions?: {
        [k: string]: any;
    } | null | undefined;
    task_queue?: string | null | undefined;
    deployment_name?: string | null | undefined;
};
/** @internal */
export declare const WorkflowExecutionRequest$outboundSchema: z.ZodType<WorkflowExecutionRequest$Outbound, WorkflowExecutionRequest>;
export declare function workflowExecutionRequestToJSON(workflowExecutionRequest: WorkflowExecutionRequest): string;
//# sourceMappingURL=workflowexecutionrequest.d.ts.map