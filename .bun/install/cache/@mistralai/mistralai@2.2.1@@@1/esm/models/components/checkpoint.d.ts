import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Metric } from "./metric.js";
export type Checkpoint = {
    /**
     * Metrics at the step number during the fine-tuning job. Use these metrics to assess if the training is going smoothly (loss should decrease, token accuracy should increase).
     */
    metrics: Metric;
    /**
     * The step number that the checkpoint was created at.
     */
    stepNumber: number;
    /**
     * The UNIX timestamp (in seconds) for when the checkpoint was created.
     */
    createdAt: number;
};
/** @internal */
export declare const Checkpoint$inboundSchema: z.ZodType<Checkpoint, unknown>;
export declare function checkpointFromJSON(jsonString: string): SafeParseResult<Checkpoint, SDKValidationError>;
//# sourceMappingURL=checkpoint.d.ts.map