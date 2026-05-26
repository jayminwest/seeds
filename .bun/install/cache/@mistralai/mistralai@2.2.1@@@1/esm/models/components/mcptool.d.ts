import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { MCPServerIcon } from "./mcpservericon.js";
import { MCPToolMeta } from "./mcptoolmeta.js";
import { ToolAnnotations } from "./toolannotations.js";
import { ToolExecution } from "./toolexecution.js";
export type MCPTool = {
    name: string;
    title?: string | null | undefined;
    description?: string | null | undefined;
    inputSchema: {
        [k: string]: any;
    };
    outputSchema?: {
        [k: string]: any;
    } | null | undefined;
    icons?: Array<MCPServerIcon> | null | undefined;
    annotations?: ToolAnnotations | null | undefined;
    meta?: MCPToolMeta | null | undefined;
    execution?: ToolExecution | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const MCPTool$inboundSchema: z.ZodType<MCPTool, unknown>;
export declare function mcpToolFromJSON(jsonString: string): SafeParseResult<MCPTool, SDKValidationError>;
//# sourceMappingURL=mcptool.d.ts.map