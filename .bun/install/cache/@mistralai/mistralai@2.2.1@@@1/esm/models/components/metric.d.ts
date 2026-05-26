import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Metrics at the step number during the fine-tuning job. Use these metrics to assess if the training is going smoothly (loss should decrease, token accuracy should increase).
 */
export type Metric = {
    trainLoss?: number | null | undefined;
    validLoss?: number | null | undefined;
    validMeanTokenAccuracy?: number | null | undefined;
};
/** @internal */
export declare const Metric$inboundSchema: z.ZodType<Metric, unknown>;
export declare function metricFromJSON(jsonString: string): SafeParseResult<Metric, SDKValidationError>;
//# sourceMappingURL=metric.d.ts.map