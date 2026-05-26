import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { BuiltInConnectors } from "./builtinconnectors.js";
export type ToolReferenceChunkTool = BuiltInConnectors | string;
export type ToolReferenceChunk = {
    type?: "tool_reference" | undefined;
    tool: BuiltInConnectors | string;
    title: string;
    url?: string | null | undefined;
    favicon?: string | null | undefined;
    description?: string | null | undefined;
};
/** @internal */
export declare const ToolReferenceChunkTool$inboundSchema: z.ZodType<ToolReferenceChunkTool, unknown>;
/** @internal */
export type ToolReferenceChunkTool$Outbound = string | string;
/** @internal */
export declare const ToolReferenceChunkTool$outboundSchema: z.ZodType<ToolReferenceChunkTool$Outbound, ToolReferenceChunkTool>;
export declare function toolReferenceChunkToolToJSON(toolReferenceChunkTool: ToolReferenceChunkTool): string;
export declare function toolReferenceChunkToolFromJSON(jsonString: string): SafeParseResult<ToolReferenceChunkTool, SDKValidationError>;
/** @internal */
export declare const ToolReferenceChunk$inboundSchema: z.ZodType<ToolReferenceChunk, unknown>;
/** @internal */
export type ToolReferenceChunk$Outbound = {
    type: "tool_reference";
    tool: string | string;
    title: string;
    url?: string | null | undefined;
    favicon?: string | null | undefined;
    description?: string | null | undefined;
};
/** @internal */
export declare const ToolReferenceChunk$outboundSchema: z.ZodType<ToolReferenceChunk$Outbound, ToolReferenceChunk>;
export declare function toolReferenceChunkToJSON(toolReferenceChunk: ToolReferenceChunk): string;
export declare function toolReferenceChunkFromJSON(jsonString: string): SafeParseResult<ToolReferenceChunk, SDKValidationError>;
//# sourceMappingURL=toolreferencechunk.d.ts.map