import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const ToolChoiceEnum: {
    readonly Auto: "auto";
    readonly None: "none";
    readonly Any: "any";
    readonly Required: "required";
};
export type ToolChoiceEnum = OpenEnum<typeof ToolChoiceEnum>;
/** @internal */
export declare const ToolChoiceEnum$inboundSchema: z.ZodType<ToolChoiceEnum, unknown>;
/** @internal */
export declare const ToolChoiceEnum$outboundSchema: z.ZodType<string, ToolChoiceEnum>;
//# sourceMappingURL=toolchoiceenum.d.ts.map