import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdateWorkflowExecutionV1WorkflowsExecutionsExecutionIdUpdatesPostRequest = {
    executionId: string;
    updateInvocationBody: components.UpdateInvocationBody;
};
/** @internal */
export type UpdateWorkflowExecutionV1WorkflowsExecutionsExecutionIdUpdatesPostRequest$Outbound = {
    execution_id: string;
    UpdateInvocationBody: components.UpdateInvocationBody$Outbound;
};
/** @internal */
export declare const UpdateWorkflowExecutionV1WorkflowsExecutionsExecutionIdUpdatesPostRequest$outboundSchema: z.ZodType<UpdateWorkflowExecutionV1WorkflowsExecutionsExecutionIdUpdatesPostRequest$Outbound, UpdateWorkflowExecutionV1WorkflowsExecutionsExecutionIdUpdatesPostRequest>;
export declare function updateWorkflowExecutionV1WorkflowsExecutionsExecutionIdUpdatesPostRequestToJSON(updateWorkflowExecutionV1WorkflowsExecutionsExecutionIdUpdatesPostRequest: UpdateWorkflowExecutionV1WorkflowsExecutionsExecutionIdUpdatesPostRequest): string;
//# sourceMappingURL=updateworkflowexecutionv1workflowsexecutionsexecutionidupdatespost.d.ts.map