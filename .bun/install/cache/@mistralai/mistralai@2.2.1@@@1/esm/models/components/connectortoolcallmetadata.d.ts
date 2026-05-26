import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ConnectorToolResultMetadata } from "./connectortoolresultmetadata.js";
/**
 * Metadata wrapper for MCP tool call responses.
 *
 * @remarks
 *
 * Nests MCP-specific fields under `mcp_meta` to avoid collisions with other
 * metadata keys (e.g. `tool_call_result`) in Harmattan's streaming deltas.
 */
export type ConnectorToolCallMetadata = {
    mcpMeta?: ConnectorToolResultMetadata | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const ConnectorToolCallMetadata$inboundSchema: z.ZodType<ConnectorToolCallMetadata, unknown>;
export declare function connectorToolCallMetadataFromJSON(jsonString: string): SafeParseResult<ConnectorToolCallMetadata, SDKValidationError>;
//# sourceMappingURL=connectortoolcallmetadata.d.ts.map