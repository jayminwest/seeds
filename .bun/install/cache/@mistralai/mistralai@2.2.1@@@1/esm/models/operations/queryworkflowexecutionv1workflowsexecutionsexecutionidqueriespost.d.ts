import * as z from "zod/v4";
import * as components from "../components/index.js";
export type QueryWorkflowExecutionV1WorkflowsExecutionsExecutionIdQueriesPostRequest = {
    executionId: string;
    queryInvocationBody: components.QueryInvocationBody;
};
/** @internal */
export type QueryWorkflowExecutionV1WorkflowsExecutionsExecutionIdQueriesPostRequest$Outbound = {
    execution_id: string;
    QueryInvocationBody: components.QueryInvocationBody$Outbound;
};
/** @internal */
export declare const QueryWorkflowExecutionV1WorkflowsExecutionsExecutionIdQueriesPostRequest$outboundSchema: z.ZodType<QueryWorkflowExecutionV1WorkflowsExecutionsExecutionIdQueriesPostRequest$Outbound, QueryWorkflowExecutionV1WorkflowsExecutionsExecutionIdQueriesPostRequest>;
export declare function queryWorkflowExecutionV1WorkflowsExecutionsExecutionIdQueriesPostRequestToJSON(queryWorkflowExecutionV1WorkflowsExecutionsExecutionIdQueriesPostRequest: QueryWorkflowExecutionV1WorkflowsExecutionsExecutionIdQueriesPostRequest): string;
//# sourceMappingURL=queryworkflowexecutionv1workflowsexecutionsexecutionidqueriespost.d.ts.map