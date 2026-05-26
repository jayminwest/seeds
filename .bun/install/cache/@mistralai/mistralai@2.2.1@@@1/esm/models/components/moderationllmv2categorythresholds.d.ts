import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ModerationLlmv2CategoryThresholds = {
    sexual?: number | null | undefined;
    hateAndDiscrimination?: number | null | undefined;
    violenceAndThreats?: number | null | undefined;
    dangerous?: number | null | undefined;
    criminal?: number | null | undefined;
    selfharm?: number | null | undefined;
    health?: number | null | undefined;
    financial?: number | null | undefined;
    law?: number | null | undefined;
    pii?: number | null | undefined;
    jailbreaking?: number | null | undefined;
};
/** @internal */
export declare const ModerationLlmv2CategoryThresholds$inboundSchema: z.ZodType<ModerationLlmv2CategoryThresholds, unknown>;
/** @internal */
export type ModerationLlmv2CategoryThresholds$Outbound = {
    sexual?: number | null | undefined;
    hate_and_discrimination?: number | null | undefined;
    violence_and_threats?: number | null | undefined;
    dangerous?: number | null | undefined;
    criminal?: number | null | undefined;
    selfharm?: number | null | undefined;
    health?: number | null | undefined;
    financial?: number | null | undefined;
    law?: number | null | undefined;
    pii?: number | null | undefined;
    jailbreaking?: number | null | undefined;
};
/** @internal */
export declare const ModerationLlmv2CategoryThresholds$outboundSchema: z.ZodType<ModerationLlmv2CategoryThresholds$Outbound, ModerationLlmv2CategoryThresholds>;
export declare function moderationLlmv2CategoryThresholdsToJSON(moderationLlmv2CategoryThresholds: ModerationLlmv2CategoryThresholds): string;
export declare function moderationLlmv2CategoryThresholdsFromJSON(jsonString: string): SafeParseResult<ModerationLlmv2CategoryThresholds, SDKValidationError>;
//# sourceMappingURL=moderationllmv2categorythresholds.d.ts.map