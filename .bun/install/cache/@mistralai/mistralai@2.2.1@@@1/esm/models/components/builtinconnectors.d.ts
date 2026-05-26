import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const BuiltInConnectors: {
    readonly WebSearch: "web_search";
    readonly WebSearchPremium: "web_search_premium";
    readonly CodeInterpreter: "code_interpreter";
    readonly ImageGeneration: "image_generation";
    readonly DocumentLibrary: "document_library";
};
export type BuiltInConnectors = OpenEnum<typeof BuiltInConnectors>;
/** @internal */
export declare const BuiltInConnectors$inboundSchema: z.ZodType<BuiltInConnectors, unknown>;
/** @internal */
export declare const BuiltInConnectors$outboundSchema: z.ZodType<string, BuiltInConnectors>;
//# sourceMappingURL=builtinconnectors.d.ts.map