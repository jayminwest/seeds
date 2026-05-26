import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export declare const Visibility: {
    readonly Model: "model";
    readonly App: "app";
};
export type Visibility = OpenEnum<typeof Visibility>;
/**
 * UI metadata for tools that reference UI resources.
 */
export type MCPUIToolMeta = {
    resourceUri?: string | null | undefined;
    visibility?: Array<Visibility> | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const Visibility$inboundSchema: z.ZodType<Visibility, unknown>;
/** @internal */
export declare const MCPUIToolMeta$inboundSchema: z.ZodType<MCPUIToolMeta, unknown>;
export declare function mcpuiToolMetaFromJSON(jsonString: string): SafeParseResult<MCPUIToolMeta, SDKValidationError>;
//# sourceMappingURL=mcpuitoolmeta.d.ts.map