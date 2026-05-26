import * as z from "zod/v4";
export type GetWorkflowEventsV1WorkflowsEventsListGetRequest = {
    /**
     * Execution ID of the root workflow that initiated this execution chain.
     */
    rootWorkflowExecId?: string | null | undefined;
    /**
     * Execution ID of the workflow that emitted this event.
     */
    workflowExecId?: string | null | undefined;
    /**
     * Run ID of the workflow that emitted this event.
     */
    workflowRunId?: string | null | undefined;
    /**
     * Maximum number of events to return.
     */
    limit?: number | undefined;
    /**
     * Cursor for pagination.
     */
    cursor?: string | null | undefined;
};
/** @internal */
export type GetWorkflowEventsV1WorkflowsEventsListGetRequest$Outbound = {
    root_workflow_exec_id?: string | null | undefined;
    workflow_exec_id?: string | null | undefined;
    workflow_run_id?: string | null | undefined;
    limit: number;
    cursor?: string | null | undefined;
};
/** @internal */
export declare const GetWorkflowEventsV1WorkflowsEventsListGetRequest$outboundSchema: z.ZodType<GetWorkflowEventsV1WorkflowsEventsListGetRequest$Outbound, GetWorkflowEventsV1WorkflowsEventsListGetRequest>;
export declare function getWorkflowEventsV1WorkflowsEventsListGetRequestToJSON(getWorkflowEventsV1WorkflowsEventsListGetRequest: GetWorkflowEventsV1WorkflowsEventsListGetRequest): string;
//# sourceMappingURL=getworkfloweventsv1workflowseventslistget.d.ts.map