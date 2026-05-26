import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type TimeSeriesMetricValue1 = number | number;
export type TimeSeriesMetricValue2 = number | number | number;
/**
 * Time-series metric with timestamp-value pairs.
 */
export type TimeSeriesMetric = {
    value: Array<Array<number | number | number>>;
};
/** @internal */
export declare const TimeSeriesMetricValue1$inboundSchema: z.ZodType<TimeSeriesMetricValue1, unknown>;
export declare function timeSeriesMetricValue1FromJSON(jsonString: string): SafeParseResult<TimeSeriesMetricValue1, SDKValidationError>;
/** @internal */
export declare const TimeSeriesMetricValue2$inboundSchema: z.ZodType<TimeSeriesMetricValue2, unknown>;
export declare function timeSeriesMetricValue2FromJSON(jsonString: string): SafeParseResult<TimeSeriesMetricValue2, SDKValidationError>;
/** @internal */
export declare const TimeSeriesMetric$inboundSchema: z.ZodType<TimeSeriesMetric, unknown>;
export declare function timeSeriesMetricFromJSON(jsonString: string): SafeParseResult<TimeSeriesMetric, SDKValidationError>;
//# sourceMappingURL=timeseriesmetric.d.ts.map