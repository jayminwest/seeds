import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ResetWorkflowV1WorkflowsExecutionsExecutionIdResetPostRequest = {
    executionId: string;
    resetInvocationBody: components.ResetInvocationBody;
};
/** @internal */
export type ResetWorkflowV1WorkflowsExecutionsExecutionIdResetPostRequest$Outbound = {
    execution_id: string;
    ResetInvocationBody: components.ResetInvocationBody$Outbound;
};
/** @internal */
export declare const ResetWorkflowV1WorkflowsExecutionsExecutionIdResetPostRequest$outboundSchema: z.ZodType<ResetWorkflowV1WorkflowsExecutionsExecutionIdResetPostRequest$Outbound, ResetWorkflowV1WorkflowsExecutionsExecutionIdResetPostRequest>;
export declare function resetWorkflowV1WorkflowsExecutionsExecutionIdResetPostRequestToJSON(resetWorkflowV1WorkflowsExecutionsExecutionIdResetPostRequest: ResetWorkflowV1WorkflowsExecutionsExecutionIdResetPostRequest): string;
//# sourceMappingURL=resetworkflowv1workflowsexecutionsexecutionidresetpost.d.ts.map