import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ToolConfiguration, ToolConfiguration$Outbound } from "./toolconfiguration.js";
export type WebSearchPremiumTool = {
    toolConfiguration?: ToolConfiguration | null | undefined;
    type: "web_search_premium";
};
/** @internal */
export declare const WebSearchPremiumTool$inboundSchema: z.ZodType<WebSearchPremiumTool, unknown>;
/** @internal */
export type WebSearchPremiumTool$Outbound = {
    tool_configuration?: ToolConfiguration$Outbound | null | undefined;
    type: "web_search_premium";
};
/** @internal */
export declare const WebSearchPremiumTool$outboundSchema: z.ZodType<WebSearchPremiumTool$Outbound, WebSearchPremiumTool>;
export declare function webSearchPremiumToolToJSON(webSearchPremiumTool: WebSearchPremiumTool): string;
export declare function webSearchPremiumToolFromJSON(jsonString: string): SafeParseResult<WebSearchPremiumTool, SDKValidationError>;
//# sourceMappingURL=websearchpremiumtool.d.ts.map