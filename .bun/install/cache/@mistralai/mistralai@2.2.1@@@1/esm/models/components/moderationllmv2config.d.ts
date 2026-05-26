import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ModerationLLMAction } from "./moderationllmaction.js";
import { ModerationLlmv2CategoryThresholds, ModerationLlmv2CategoryThresholds$Outbound } from "./moderationllmv2categorythresholds.js";
export type ModerationLlmv2Config = {
    /**
     * Override model name. Should be omitted in general.
     */
    modelName?: string | undefined;
    customCategoryThresholds?: ModerationLlmv2CategoryThresholds | null | undefined;
    /**
     * If true, only evaluate categories in custom_category_thresholds; others are ignored.
     */
    ignoreOtherCategories?: boolean | undefined;
    action?: ModerationLLMAction | undefined;
};
/** @internal */
export declare const ModerationLlmv2Config$inboundSchema: z.ZodType<ModerationLlmv2Config, unknown>;
/** @internal */
export type ModerationLlmv2Config$Outbound = {
    model_name: string;
    custom_category_thresholds?: ModerationLlmv2CategoryThresholds$Outbound | null | undefined;
    ignore_other_categories: boolean;
    action?: string | undefined;
};
/** @internal */
export declare const ModerationLlmv2Config$outboundSchema: z.ZodType<ModerationLlmv2Config$Outbound, ModerationLlmv2Config>;
export declare function moderationLlmv2ConfigToJSON(moderationLlmv2Config: ModerationLlmv2Config): string;
export declare function moderationLlmv2ConfigFromJSON(jsonString: string): SafeParseResult<ModerationLlmv2Config, SDKValidationError>;
//# sourceMappingURL=moderationllmv2config.d.ts.map