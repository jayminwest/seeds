import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ToolConfiguration, ToolConfiguration$Outbound } from "./toolconfiguration.js";
export type WebSearchTool = {
    toolConfiguration?: ToolConfiguration | null | undefined;
    type: "web_search";
};
/** @internal */
export declare const WebSearchTool$inboundSchema: z.ZodType<WebSearchTool, unknown>;
/** @internal */
export type WebSearchTool$Outbound = {
    tool_configuration?: ToolConfiguration$Outbound | null | undefined;
    type: "web_search";
};
/** @internal */
export declare const WebSearchTool$outboundSchema: z.ZodType<WebSearchTool$Outbound, WebSearchTool>;
export declare function webSearchToolToJSON(webSearchTool: WebSearchTool): string;
export declare function webSearchToolFromJSON(jsonString: string): SafeParseResult<WebSearchTool, SDKValidationError>;
//# sourceMappingURL=websearchtool.d.ts.map