import * as z from "zod/v4";
export type GetWorkflowExecutionHistoryV1WorkflowsExecutionsExecutionIdHistoryGetRequest = {
    executionId: string;
    decodePayloads?: boolean | undefined;
};
/** @internal */
export type GetWorkflowExecutionHistoryV1WorkflowsExecutionsExecutionIdHistoryGetRequest$Outbound = {
    execution_id: string;
    decode_payloads: boolean;
};
/** @internal */
export declare const GetWorkflowExecutionHistoryV1WorkflowsExecutionsExecutionIdHistoryGetRequest$outboundSchema: z.ZodType<GetWorkflowExecutionHistoryV1WorkflowsExecutionsExecutionIdHistoryGetRequest$Outbound, GetWorkflowExecutionHistoryV1WorkflowsExecutionsExecutionIdHistoryGetRequest>;
export declare function getWorkflowExecutionHistoryV1WorkflowsExecutionsExecutionIdHistoryGetRequestToJSON(getWorkflowExecutionHistoryV1WorkflowsExecutionsExecutionIdHistoryGetRequest: GetWorkflowExecutionHistoryV1WorkflowsExecutionsExecutionIdHistoryGetRequest): string;
//# sourceMappingURL=getworkflowexecutionhistoryv1workflowsexecutionsexecutionidhistoryget.d.ts.map