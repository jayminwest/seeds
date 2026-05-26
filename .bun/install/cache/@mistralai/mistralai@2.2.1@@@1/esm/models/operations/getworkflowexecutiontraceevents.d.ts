import * as z from "zod/v4";
export type GetWorkflowExecutionTraceEventsRequest = {
    executionId: string;
    mergeSameIdEvents?: boolean | undefined;
    includeInternalEvents?: boolean | undefined;
};
/** @internal */
export type GetWorkflowExecutionTraceEventsRequest$Outbound = {
    execution_id: string;
    merge_same_id_events: boolean;
    include_internal_events: boolean;
};
/** @internal */
export declare const GetWorkflowExecutionTraceEventsRequest$outboundSchema: z.ZodType<GetWorkflowExecutionTraceEventsRequest$Outbound, GetWorkflowExecutionTraceEventsRequest>;
export declare function getWorkflowExecutionTraceEventsRequestToJSON(getWorkflowExecutionTraceEventsRequest: GetWorkflowExecutionTraceEventsRequest): string;
//# sourceMappingURL=getworkflowexecutiontraceevents.d.ts.map