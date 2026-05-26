import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * An icon for display in user interfaces.
 */
export type MCPServerIcon = {
    src: string;
    mimeType?: string | null | undefined;
    sizes?: Array<string> | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const MCPServerIcon$inboundSchema: z.ZodType<MCPServerIcon, unknown>;
export declare function mcpServerIconFromJSON(jsonString: string): SafeParseResult<MCPServerIcon, SDKValidationError>;
//# sourceMappingURL=mcpservericon.d.ts.map