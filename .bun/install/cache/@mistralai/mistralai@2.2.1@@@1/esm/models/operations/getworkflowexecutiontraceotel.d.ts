import * as z from "zod/v4";
export type GetWorkflowExecutionTraceOtelRequest = {
    executionId: string;
};
/** @internal */
export type GetWorkflowExecutionTraceOtelRequest$Outbound = {
    execution_id: string;
};
/** @internal */
export declare const GetWorkflowExecutionTraceOtelRequest$outboundSchema: z.ZodType<GetWorkflowExecutionTraceOtelRequest$Outbound, GetWorkflowExecutionTraceOtelRequest>;
export declare function getWorkflowExecutionTraceOtelRequestToJSON(getWorkflowExecutionTraceOtelRequest: GetWorkflowExecutionTraceOtelRequest): string;
//# sourceMappingURL=getworkflowexecutiontraceotel.d.ts.map