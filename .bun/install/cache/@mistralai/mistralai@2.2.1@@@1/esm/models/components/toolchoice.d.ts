import * as z from "zod/v4";
import { FunctionName, FunctionName$Outbound } from "./functionname.js";
/**
 * ToolChoice is either a ToolChoiceEnum or a ToolChoice
 */
export type ToolChoice = {
    type?: string | undefined;
    /**
     * this restriction of `Function` is used to select a specific function to call
     */
    function: FunctionName;
};
/** @internal */
export type ToolChoice$Outbound = {
    type?: string | undefined;
    function: FunctionName$Outbound;
};
/** @internal */
export declare const ToolChoice$outboundSchema: z.ZodType<ToolChoice$Outbound, ToolChoice>;
export declare function toolChoiceToJSON(toolChoice: ToolChoice): string;
//# sourceMappingURL=toolchoice.d.ts.map