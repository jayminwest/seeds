import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { FunctionT, FunctionT$Outbound } from "./function.js";
export type FunctionTool = {
    type: "function";
    function: FunctionT;
};
/** @internal */
export declare const FunctionTool$inboundSchema: z.ZodType<FunctionTool, unknown>;
/** @internal */
export type FunctionTool$Outbound = {
    type: "function";
    function: FunctionT$Outbound;
};
/** @internal */
export declare const FunctionTool$outboundSchema: z.ZodType<FunctionTool$Outbound, FunctionTool>;
export declare function functionToolToJSON(functionTool: FunctionTool): string;
export declare function functionToolFromJSON(jsonString: string): SafeParseResult<FunctionTool, SDKValidationError>;
//# sourceMappingURL=functiontool.d.ts.map