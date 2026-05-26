import * as z from "zod/v4";
export type ListDeploymentsV1WorkflowsDeploymentsGetRequest = {
    activeOnly?: boolean | undefined;
    workflowName?: string | null | undefined;
};
/** @internal */
export type ListDeploymentsV1WorkflowsDeploymentsGetRequest$Outbound = {
    active_only: boolean;
    workflow_name?: string | null | undefined;
};
/** @internal */
export declare const ListDeploymentsV1WorkflowsDeploymentsGetRequest$outboundSchema: z.ZodType<ListDeploymentsV1WorkflowsDeploymentsGetRequest$Outbound, ListDeploymentsV1WorkflowsDeploymentsGetRequest>;
export declare function listDeploymentsV1WorkflowsDeploymentsGetRequestToJSON(listDeploymentsV1WorkflowsDeploymentsGetRequest: ListDeploymentsV1WorkflowsDeploymentsGetRequest): string;
//# sourceMappingURL=listdeploymentsv1workflowsdeploymentsget.d.ts.map