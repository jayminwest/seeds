import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { MCPUIToolMeta } from "./mcpuitoolmeta.js";
import { TurbineToolMeta } from "./turbinetoolmeta.js";
/**
 * Typed _meta for MCP tools.
 *
 * @remarks
 *
 * Only the 'ui' field is typed. Other fields are allowed via extra="allow".
 */
export type MCPToolMeta = {
    ui?: MCPUIToolMeta | null | undefined;
    aiMistralTurbine?: TurbineToolMeta | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const MCPToolMeta$inboundSchema: z.ZodType<MCPToolMeta, unknown>;
export declare function mcpToolMetaFromJSON(jsonString: string): SafeParseResult<MCPToolMeta, SDKValidationError>;
//# sourceMappingURL=mcptoolmeta.d.ts.map