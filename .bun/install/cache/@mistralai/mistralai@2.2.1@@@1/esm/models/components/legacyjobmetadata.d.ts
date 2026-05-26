import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type LegacyJobMetadata = {
    /**
     * The approximated time (in seconds) for the fine-tuning process to complete.
     */
    expectedDurationSeconds?: number | null | undefined;
    /**
     * The cost of the fine-tuning job.
     */
    cost?: number | null | undefined;
    /**
     * The currency used for the fine-tuning job cost.
     */
    costCurrency?: string | null | undefined;
    /**
     * The number of tokens consumed by one training step.
     */
    trainTokensPerStep?: number | null | undefined;
    /**
     * The total number of tokens used during the fine-tuning process.
     */
    trainTokens?: number | null | undefined;
    /**
     * The total number of tokens in the training dataset.
     */
    dataTokens?: number | null | undefined;
    estimatedStartTime?: number | null | undefined;
    deprecated: boolean;
    details: string;
    /**
     * The number of complete passes through the entire training dataset.
     */
    epochs?: number | null | undefined;
    /**
     * The number of training steps to perform. A training step refers to a single update of the model weights during the fine-tuning process. This update is typically calculated using a batch of samples from the training dataset.
     */
    trainingSteps?: number | null | undefined;
    object: "job.metadata";
};
/** @internal */
export declare const LegacyJobMetadata$inboundSchema: z.ZodType<LegacyJobMetadata, unknown>;
export declare function legacyJobMetadataFromJSON(jsonString: string): SafeParseResult<LegacyJobMetadata, SDKValidationError>;
//# sourceMappingURL=legacyjobmetadata.d.ts.map