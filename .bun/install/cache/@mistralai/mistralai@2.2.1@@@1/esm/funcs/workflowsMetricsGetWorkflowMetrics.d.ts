import { MistralCore } from "../core.js";
import { RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import { ConnectionError, InvalidRequestError, RequestAbortedError, RequestTimeoutError, UnexpectedClientError } from "../models/errors/httpclienterrors.js";
import * as errors from "../models/errors/index.js";
import { MistralError } from "../models/errors/mistralerror.js";
import { ResponseValidationError } from "../models/errors/responsevalidationerror.js";
import { SDKValidationError } from "../models/errors/sdkvalidationerror.js";
import * as operations from "../models/operations/index.js";
import { APIPromise } from "../types/async.js";
import { Result } from "../types/fp.js";
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
export declare function workflowsMetricsGetWorkflowMetrics(client: MistralCore, request: operations.GetWorkflowMetricsV1WorkflowsWorkflowNameMetricsGetRequest, options?: RequestOptions): APIPromise<Result<components.WorkflowMetrics, errors.HTTPValidationError | MistralError | ResponseValidationError | ConnectionError | RequestAbortedError | RequestTimeoutError | InvalidRequestError | UnexpectedClientError | SDKValidationError>>;
//# sourceMappingURL=workflowsMetricsGetWorkflowMetrics.d.ts.map