import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const ModerationLLMAction: {
    readonly None: "none";
    readonly Block: "block";
};
export type ModerationLLMAction = OpenEnum<typeof ModerationLLMAction>;
/** @internal */
export declare const ModerationLLMAction$inboundSchema: z.ZodType<ModerationLLMAction, unknown>;
/** @internal */
export declare const ModerationLLMAction$outboundSchema: z.ZodType<string, ModerationLLMAction>;
//# sourceMappingURL=moderationllmaction.d.ts.map