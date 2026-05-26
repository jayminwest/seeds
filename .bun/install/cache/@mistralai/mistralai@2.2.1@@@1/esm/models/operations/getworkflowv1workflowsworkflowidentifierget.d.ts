import * as z from "zod/v4";
export type GetWorkflowV1WorkflowsWorkflowIdentifierGetRequest = {
    workflowIdentifier: string;
};
/** @internal */
export type GetWorkflowV1WorkflowsWorkflowIdentifierGetRequest$Outbound = {
    workflow_identifier: string;
};
/** @internal */
export declare const GetWorkflowV1WorkflowsWorkflowIdentifierGetRequest$outboundSchema: z.ZodType<GetWorkflowV1WorkflowsWorkflowIdentifierGetRequest$Outbound, GetWorkflowV1WorkflowsWorkflowIdentifierGetRequest>;
export declare function getWorkflowV1WorkflowsWorkflowIdentifierGetRequestToJSON(getWorkflowV1WorkflowsWorkflowIdentifierGetRequest: GetWorkflowV1WorkflowsWorkflowIdentifierGetRequest): string;
//# sourceMappingURL=getworkflowv1workflowsworkflowidentifierget.d.ts.map