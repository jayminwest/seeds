import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdateWorkflowV1WorkflowsWorkflowIdentifierPutRequest = {
    workflowIdentifier: string;
    workflowUpdateRequest: components.WorkflowUpdateRequest;
};
/** @internal */
export type UpdateWorkflowV1WorkflowsWorkflowIdentifierPutRequest$Outbound = {
    workflow_identifier: string;
    WorkflowUpdateRequest: components.WorkflowUpdateRequest$Outbound;
};
/** @internal */
export declare const UpdateWorkflowV1WorkflowsWorkflowIdentifierPutRequest$outboundSchema: z.ZodType<UpdateWorkflowV1WorkflowsWorkflowIdentifierPutRequest$Outbound, UpdateWorkflowV1WorkflowsWorkflowIdentifierPutRequest>;
export declare function updateWorkflowV1WorkflowsWorkflowIdentifierPutRequestToJSON(updateWorkflowV1WorkflowsWorkflowIdentifierPutRequest: UpdateWorkflowV1WorkflowsWorkflowIdentifierPutRequest): string;
//# sourceMappingURL=updateworkflowv1workflowsworkflowidentifierput.d.ts.map