import { EventStream } from "../lib/event-streams.js";
import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Executions extends ClientSDK {
    /**
     * Get Workflow Execution
     */
    getWorkflowExecution(request: operations.GetWorkflowExecutionV1WorkflowsExecutionsExecutionIdGetRequest, options?: RequestOptions): Promise<components.WorkflowExecutionResponse>;
    /**
     * Get Workflow Execution History
     */
    getWorkflowExecutionHistory(request: operations.GetWorkflowExecutionHistoryV1WorkflowsExecutionsExecutionIdHistoryGetRequest, options?: RequestOptions): Promise<any>;
    /**
     * Signal Workflow Execution
     */
    signalWorkflowExecution(request: operations.SignalWorkflowExecutionV1WorkflowsExecutionsExecutionIdSignalsPostRequest, options?: RequestOptions): Promise<components.SignalWorkflowResponse>;
    /**
     * Query Workflow Execution
     */
    queryWorkflowExecution(request: operations.QueryWorkflowExecutionV1WorkflowsExecutionsExecutionIdQueriesPostRequest, options?: RequestOptions): Promise<components.QueryWorkflowResponse>;
    /**
     * Terminate Workflow Execution
     */
    terminateWorkflowExecution(request: operations.TerminateWorkflowExecutionV1WorkflowsExecutionsExecutionIdTerminatePostRequest, options?: RequestOptions): Promise<void>;
    /**
     * Batch Terminate Workflow Executions
     */
    batchTerminateWorkflowExecutions(request: components.BatchExecutionBody, options?: RequestOptions): Promise<components.BatchExecutionResponse>;
    /**
     * Cancel Workflow Execution
     */
    cancelWorkflowExecution(request: operations.CancelWorkflowExecutionV1WorkflowsExecutionsExecutionIdCancelPostRequest, options?: RequestOptions): Promise<void>;
    /**
     * Batch Cancel Workflow Executions
     */
    batchCancelWorkflowExecutions(request: components.BatchExecutionBody, options?: RequestOptions): Promise<components.BatchExecutionResponse>;
    /**
     * Reset Workflow
     */
    resetWorkflow(request: operations.ResetWorkflowV1WorkflowsExecutionsExecutionIdResetPostRequest, options?: RequestOptions): Promise<void>;
    /**
     * Update Workflow Execution
     */
    updateWorkflowExecution(request: operations.UpdateWorkflowExecutionV1WorkflowsExecutionsExecutionIdUpdatesPostRequest, options?: RequestOptions): Promise<components.UpdateWorkflowResponse>;
    /**
     * Get Workflow Execution Trace Otel
     */
    getWorkflowExecutionTraceOtel(request: operations.GetWorkflowExecutionTraceOtelRequest, options?: RequestOptions): Promise<components.WorkflowExecutionTraceOTelResponse>;
    /**
     * Get Workflow Execution Trace Summary
     */
    getWorkflowExecutionTraceSummary(request: operations.GetWorkflowExecutionTraceSummaryRequest, options?: RequestOptions): Promise<components.WorkflowExecutionTraceSummaryResponse>;
    /**
     * Get Workflow Execution Trace Events
     */
    getWorkflowExecutionTraceEvents(request: operations.GetWorkflowExecutionTraceEventsRequest, options?: RequestOptions): Promise<components.WorkflowExecutionTraceEventsResponse>;
    /**
     * Stream
     */
    stream(request: operations.StreamV1WorkflowsExecutionsExecutionIdStreamGetRequest, options?: RequestOptions): Promise<EventStream<operations.StreamV1WorkflowsExecutionsExecutionIdStreamGetResponseBody>>;
}
//# sourceMappingURL=executions.d.ts.map