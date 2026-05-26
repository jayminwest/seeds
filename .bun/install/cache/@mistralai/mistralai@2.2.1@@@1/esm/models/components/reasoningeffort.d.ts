import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const ReasoningEffort: {
    readonly None: "none";
    readonly High: "high";
};
export type ReasoningEffort = OpenEnum<typeof ReasoningEffort>;
/** @internal */
export declare const ReasoningEffort$inboundSchema: z.ZodType<ReasoningEffort, unknown>;
/** @internal */
export declare const ReasoningEffort$outboundSchema: z.ZodType<string, ReasoningEffort>;
//# sourceMappingURL=reasoningeffort.d.ts.map