import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PromptTokensDetails } from "./prompttokensdetails.js";
export type UsageInfoDollarDefs = {
    promptAudioSeconds?: number | null | undefined;
    promptTokens: number;
    totalTokens: number;
    completionTokens?: number | null | undefined;
    requestCount?: number | null | undefined;
    promptTokensDetails?: PromptTokensDetails | null | undefined;
    promptTokenDetails?: PromptTokensDetails | null | undefined;
    numCachedTokens?: number | null | undefined;
};
/** @internal */
export declare const UsageInfoDollarDefs$inboundSchema: z.ZodType<UsageInfoDollarDefs, unknown>;
export declare function usageInfoDollarDefsFromJSON(jsonString: string): SafeParseResult<UsageInfoDollarDefs, SDKValidationError>;
//# sourceMappingURL=usageinfodollardefs.d.ts.map