import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Metrics extends ClientSDK {
    /**
     * Get Workflow Metrics
     *
     * @remarks
     * Get comprehensive metrics for a specific workflow.
     *
     * Args:
     *     workflow_name: The name of the workflow type to get metrics for
     *     start_time: Optional start time filter (ISO 8601 format)
     *     end_time: Optional end time filter (ISO 8601 format)
     *
     * Returns:
     *     WorkflowMetrics: Dictionary containing metrics:
     *         - execution_count: Total number of executions
     *         - success_count: Number of successful executions
     *         - error_count: Number of failed/terminated executions
     *         - average_latency_ms: Average execution duration in milliseconds
     *         - retry_rate: Proportion of workflows with retries
     *         - latency_over_time: Time-series data of execution durations
     *
     * Example:
     *     GET /v1/workflows/MyWorkflow/metrics
     *     GET /v1/workflows/MyWorkflow/metrics?start_time=2025-01-01T00:00:00Z
     *     GET /v1/workflows/MyWorkflow/metrics?start_time=2025-01-01T00:00:00Z&end_time=2025-12-31T23:59:59Z
     */
    getWorkflowMetrics(request: operations.GetWorkflowMetricsV1WorkflowsWorkflowNameMetricsGetRequest, options?: RequestOptions): Promise<components.WorkflowMetrics>;
}
//# sourceMappingURL=metrics.d.ts.map