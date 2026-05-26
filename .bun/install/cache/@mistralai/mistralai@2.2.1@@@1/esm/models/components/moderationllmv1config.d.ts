import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ModerationLLMAction } from "./moderationllmaction.js";
import { ModerationLlmv1CategoryThresholds, ModerationLlmv1CategoryThresholds$Outbound } from "./moderationllmv1categorythresholds.js";
export type ModerationLlmv1Config = {
    /**
     * Override model name. Should be omitted in general.
     */
    modelName?: string | undefined;
    customCategoryThresholds?: ModerationLlmv1CategoryThresholds | null | undefined;
    /**
     * If true, only evaluate categories in custom_category_thresholds; others are ignored.
     */
    ignoreOtherCategories?: boolean | undefined;
    action?: ModerationLLMAction | undefined;
};
/** @internal */
export declare const ModerationLlmv1Config$inboundSchema: z.ZodType<ModerationLlmv1Config, unknown>;
/** @internal */
export type ModerationLlmv1Config$Outbound = {
    model_name: string;
    custom_category_thresholds?: ModerationLlmv1CategoryThresholds$Outbound | null | undefined;
    ignore_other_categories: boolean;
    action?: string | undefined;
};
/** @internal */
export declare const ModerationLlmv1Config$outboundSchema: z.ZodType<ModerationLlmv1Config$Outbound, ModerationLlmv1Config>;
export declare function moderationLlmv1ConfigToJSON(moderationLlmv1Config: ModerationLlmv1Config): string;
export declare function moderationLlmv1ConfigFromJSON(jsonString: string): SafeParseResult<ModerationLlmv1Config, SDKValidationError>;
//# sourceMappingURL=moderationllmv1config.d.ts.map