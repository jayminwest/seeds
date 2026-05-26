import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ScalarMetricValue = number | number;
/**
 * Scalar metric with a single value.
 */
export type ScalarMetric = {
    value: number | number;
};
/** @internal */
export declare const ScalarMetricValue$inboundSchema: z.ZodType<ScalarMetricValue, unknown>;
export declare function scalarMetricValueFromJSON(jsonString: string): SafeParseResult<ScalarMetricValue, SDKValidationError>;
/** @internal */
export declare const ScalarMetric$inboundSchema: z.ZodType<ScalarMetric, unknown>;
export declare function scalarMetricFromJSON(jsonString: string): SafeParseResult<ScalarMetric, SDKValidationError>;
//# sourceMappingURL=scalarmetric.d.ts.map