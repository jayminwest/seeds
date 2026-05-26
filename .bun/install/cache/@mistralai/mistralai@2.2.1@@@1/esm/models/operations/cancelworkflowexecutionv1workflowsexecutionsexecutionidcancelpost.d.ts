import * as z from "zod/v4";
export type CancelWorkflowExecutionV1WorkflowsExecutionsExecutionIdCancelPostRequest = {
    executionId: string;
};
/** @internal */
export type CancelWorkflowExecutionV1WorkflowsExecutionsExecutionIdCancelPostRequest$Outbound = {
    execution_id: string;
};
/** @internal */
export declare const CancelWorkflowExecutionV1WorkflowsExecutionsExecutionIdCancelPostRequest$outboundSchema: z.ZodType<CancelWorkflowExecutionV1WorkflowsExecutionsExecutionIdCancelPostRequest$Outbound, CancelWorkflowExecutionV1WorkflowsExecutionsExecutionIdCancelPostRequest>;
export declare function cancelWorkflowExecutionV1WorkflowsExecutionsExecutionIdCancelPostRequestToJSON(cancelWorkflowExecutionV1WorkflowsExecutionsExecutionIdCancelPostRequest: CancelWorkflowExecutionV1WorkflowsExecutionsExecutionIdCancelPostRequest): string;
//# sourceMappingURL=cancelworkflowexecutionv1workflowsexecutionsexecutionidcancelpost.d.ts.map