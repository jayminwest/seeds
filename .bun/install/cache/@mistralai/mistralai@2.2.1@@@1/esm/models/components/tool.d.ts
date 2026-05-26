import * as z from "zod/v4";
import { FunctionT, FunctionT$Outbound } from "./function.js";
export type Tool = {
    type: "function";
    function: FunctionT;
};
/** @internal */
export type Tool$Outbound = {
    type: "function";
    function: FunctionT$Outbound;
};
/** @internal */
export declare const Tool$outboundSchema: z.ZodType<Tool$Outbound, Tool>;
export declare function toolToJSON(tool: Tool): string;
//# sourceMappingURL=tool.d.ts.map