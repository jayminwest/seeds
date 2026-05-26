import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * MCP-specific result metadata (isError, structuredContent, _meta).
 */
export type ConnectorToolResultMetadata = {
    isError: boolean;
    structuredContent?: {
        [k: string]: any;
    } | null | undefined;
    meta?: {
        [k: string]: any;
    } | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const ConnectorToolResultMetadata$inboundSchema: z.ZodType<ConnectorToolResultMetadata, unknown>;
export declare function connectorToolResultMetadataFromJSON(jsonString: string): SafeParseResult<ConnectorToolResultMetadata, SDKValidationError>;
//# sourceMappingURL=connectortoolresultmetadata.d.ts.map