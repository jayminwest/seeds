import * as z from "zod/v4";
export type GetWorkflowMetricsV1WorkflowsWorkflowNameMetricsGetRequest = {
    workflowName: string;
    /**
     * Filter workflows started after this time (ISO 8601)
     */
    startTime?: Date | null | undefined;
    /**
     * Filter workflows started before this time (ISO 8601)
     */
    endTime?: Date | null | undefined;
};
/** @internal */
export type GetWorkflowMetricsV1WorkflowsWorkflowNameMetricsGetRequest$Outbound = {
    workflow_name: string;
    start_time?: string | null | undefined;
    end_time?: string | null | undefined;
};
/** @internal */
export declare const GetWorkflowMetricsV1WorkflowsWorkflowNameMetricsGetRequest$outboundSchema: z.ZodType<GetWorkflowMetricsV1WorkflowsWorkflowNameMetricsGetRequest$Outbound, GetWorkflowMetricsV1WorkflowsWorkflowNameMetricsGetRequest>;
export declare function getWorkflowMetricsV1WorkflowsWorkflowNameMetricsGetRequestToJSON(getWorkflowMetricsV1WorkflowsWorkflowNameMetricsGetRequest: GetWorkflowMetricsV1WorkflowsWorkflowNameMetricsGetRequest): string;
//# sourceMappingURL=getworkflowmetricsv1workflowsworkflownamemetricsget.d.ts.map