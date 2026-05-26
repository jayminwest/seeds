import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const ToolType: {
    readonly Rag: "rag";
    readonly Image: "image";
    readonly Code: "code";
    readonly Event: "event";
};
export type ToolType = OpenEnum<typeof ToolType>;
/** @internal */
export declare const ToolType$inboundSchema: z.ZodType<ToolType, unknown>;
//# sourceMappingURL=tooltype.d.ts.map