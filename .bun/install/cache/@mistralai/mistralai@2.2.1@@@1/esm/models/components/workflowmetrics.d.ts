import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ScalarMetric } from "./scalarmetric.js";
import { TimeSeriesMetric } from "./timeseriesmetric.js";
/**
 * Complete metrics for a specific workflow.
 *
 * @remarks
 *
 * This type combines all metric categories.
 */
export type WorkflowMetrics = {
    /**
     * Scalar metric with a single value.
     */
    executionCount: ScalarMetric;
    /**
     * Scalar metric with a single value.
     */
    successCount: ScalarMetric;
    /**
     * Scalar metric with a single value.
     */
    errorCount: ScalarMetric;
    /**
     * Scalar metric with a single value.
     */
    averageLatencyMs: ScalarMetric;
    /**
     * Time-series metric with timestamp-value pairs.
     */
    latencyOverTime: TimeSeriesMetric;
    /**
     * Scalar metric with a single value.
     */
    retryRate: ScalarMetric;
};
/** @internal */
export declare const WorkflowMetrics$inboundSchema: z.ZodType<WorkflowMetrics, unknown>;
export declare function workflowMetricsFromJSON(jsonString: string): SafeParseResult<WorkflowMetrics, SDKValidationError>;
//# sourceMappingURL=workflowmetrics.d.ts.map