import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { AudioContent } from "./audiocontent.js";
import { ConnectorToolCallMetadata } from "./connectortoolcallmetadata.js";
import { EmbeddedResource } from "./embeddedresource.js";
import { ImageContent } from "./imagecontent.js";
import { ResourceLink } from "./resourcelink.js";
import { TextContent } from "./textcontent.js";
export type ConnectorToolCallResponseContent = TextContent | ImageContent | AudioContent | ResourceLink | EmbeddedResource | discriminatedUnionTypes.Unknown<"type">;
/**
 * Response from calling an MCP tool.
 *
 * @remarks
 *
 * We override mcp_types.CallToolResult because:
 * - Models only support `content`, not `structuredContent` at top level
 * - Downstream consumers (le-chat, etc.) need structuredContent/isError/_meta via metadata
 *
 * SYNC: Keep in sync with Harmattan (orchestrator) for harmonized tool result processing.
 */
export type ConnectorToolCallResponse = {
    content: Array<TextContent | ImageContent | AudioContent | ResourceLink | EmbeddedResource | discriminatedUnionTypes.Unknown<"type">>;
    metadata?: ConnectorToolCallMetadata | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const ConnectorToolCallResponseContent$inboundSchema: z.ZodType<ConnectorToolCallResponseContent, unknown>;
export declare function connectorToolCallResponseContentFromJSON(jsonString: string): SafeParseResult<ConnectorToolCallResponseContent, SDKValidationError>;
/** @internal */
export declare const ConnectorToolCallResponse$inboundSchema: z.ZodType<ConnectorToolCallResponse, unknown>;
export declare function connectorToolCallResponseFromJSON(jsonString: string): SafeParseResult<ConnectorToolCallResponse, SDKValidationError>;
//# sourceMappingURL=connectortoolcallresponse.d.ts.map