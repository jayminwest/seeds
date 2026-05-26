import * as z from "zod/v4";
export type GetRunV1WorkflowsRunsRunIdGetRequest = {
    runId: string;
};
/** @internal */
export type GetRunV1WorkflowsRunsRunIdGetRequest$Outbound = {
    run_id: string;
};
/** @internal */
export declare const GetRunV1WorkflowsRunsRunIdGetRequest$outboundSchema: z.ZodType<GetRunV1WorkflowsRunsRunIdGetRequest$Outbound, GetRunV1WorkflowsRunsRunIdGetRequest>;
export declare function getRunV1WorkflowsRunsRunIdGetRequestToJSON(getRunV1WorkflowsRunsRunIdGetRequest: GetRunV1WorkflowsRunsRunIdGetRequest): string;
//# sourceMappingURL=getrunv1workflowsrunsrunidget.d.ts.map