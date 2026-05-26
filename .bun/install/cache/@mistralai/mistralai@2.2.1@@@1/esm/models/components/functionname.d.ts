import * as z from "zod/v4";
/**
 * this restriction of `Function` is used to select a specific function to call
 */
export type FunctionName = {
    name: string;
};
/** @internal */
export type FunctionName$Outbound = {
    name: string;
};
/** @internal */
export declare const FunctionName$outboundSchema: z.ZodType<FunctionName$Outbound, FunctionName>;
export declare function functionNameToJSON(functionName: FunctionName): string;
//# sourceMappingURL=functionname.d.ts.map