import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type JobMetadata = {
    expectedDurationSeconds?: number | null | undefined;
    cost?: number | null | undefined;
    costCurrency?: string | null | undefined;
    trainTokensPerStep?: number | null | undefined;
    trainTokens?: number | null | undefined;
    dataTokens?: number | null | undefined;
    estimatedStartTime?: number | null | undefined;
};
/** @internal */
export declare const JobMetadata$inboundSchema: z.ZodType<JobMetadata, unknown>;
export declare function jobMetadataFromJSON(jsonString: string): SafeParseResult<JobMetadata, SDKValidationError>;
//# sourceMappingURL=jobmetadata.d.ts.map