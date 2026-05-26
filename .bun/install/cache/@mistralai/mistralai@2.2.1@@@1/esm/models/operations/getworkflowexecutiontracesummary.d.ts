import * as z from "zod/v4";
export type GetWorkflowExecutionTraceSummaryRequest = {
    executionId: string;
};
/** @internal */
export type GetWorkflowExecutionTraceSummaryRequest$Outbound = {
    execution_id: string;
};
/** @internal */
export declare const GetWorkflowExecutionTraceSummaryRequest$outboundSchema: z.ZodType<GetWorkflowExecutionTraceSummaryRequest$Outbound, GetWorkflowExecutionTraceSummaryRequest>;
export declare function getWorkflowExecutionTraceSummaryRequestToJSON(getWorkflowExecutionTraceSummaryRequest: GetWorkflowExecutionTraceSummaryRequest): string;
//# sourceMappingURL=getworkflowexecutiontracesummary.d.ts.map