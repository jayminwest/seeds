import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { BuiltInConnectors } from "./builtinconnectors.js";
export type ToolFileChunkTool = BuiltInConnectors | string;
export type ToolFileChunk = {
    type?: "tool_file" | undefined;
    tool: BuiltInConnectors | string;
    fileId: string;
    fileName?: string | null | undefined;
    fileType?: string | null | undefined;
};
/** @internal */
export declare const ToolFileChunkTool$inboundSchema: z.ZodType<ToolFileChunkTool, unknown>;
/** @internal */
export type ToolFileChunkTool$Outbound = string | string;
/** @internal */
export declare const ToolFileChunkTool$outboundSchema: z.ZodType<ToolFileChunkTool$Outbound, ToolFileChunkTool>;
export declare function toolFileChunkToolToJSON(toolFileChunkTool: ToolFileChunkTool): string;
export declare function toolFileChunkToolFromJSON(jsonString: string): SafeParseResult<ToolFileChunkTool, SDKValidationError>;
/** @internal */
export declare const ToolFileChunk$inboundSchema: z.ZodType<ToolFileChunk, unknown>;
/** @internal */
export type ToolFileChunk$Outbound = {
    type: "tool_file";
    tool: string | string;
    file_id: string;
    file_name?: string | null | undefined;
    file_type?: string | null | undefined;
};
/** @internal */
export declare const ToolFileChunk$outboundSchema: z.ZodType<ToolFileChunk$Outbound, ToolFileChunk>;
export declare function toolFileChunkToJSON(toolFileChunk: ToolFileChunk): string;
export declare function toolFileChunkFromJSON(jsonString: string): SafeParseResult<ToolFileChunk, SDKValidationError>;
//# sourceMappingURL=toolfilechunk.d.ts.map