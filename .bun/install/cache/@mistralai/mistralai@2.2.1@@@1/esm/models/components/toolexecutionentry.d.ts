import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { BuiltInConnectors } from "./builtinconnectors.js";
export type ToolExecutionEntryName = BuiltInConnectors | string;
export type ToolExecutionEntry = {
    object?: "entry" | undefined;
    type?: "tool.execution" | undefined;
    createdAt?: Date | undefined;
    completedAt?: Date | null | undefined;
    agentId?: string | null | undefined;
    model?: string | null | undefined;
    id?: string | undefined;
    name: BuiltInConnectors | string;
    arguments: string;
    info?: {
        [k: string]: any;
    } | undefined;
};
/** @internal */
export declare const ToolExecutionEntryName$inboundSchema: z.ZodType<ToolExecutionEntryName, unknown>;
/** @internal */
export type ToolExecutionEntryName$Outbound = string | string;
/** @internal */
export declare const ToolExecutionEntryName$outboundSchema: z.ZodType<ToolExecutionEntryName$Outbound, ToolExecutionEntryName>;
export declare function toolExecutionEntryNameToJSON(toolExecutionEntryName: ToolExecutionEntryName): string;
export declare function toolExecutionEntryNameFromJSON(jsonString: string): SafeParseResult<ToolExecutionEntryName, SDKValidationError>;
/** @internal */
export declare const ToolExecutionEntry$inboundSchema: z.ZodType<ToolExecutionEntry, unknown>;
/** @internal */
export type ToolExecutionEntry$Outbound = {
    object: "entry";
    type: "tool.execution";
    created_at?: string | undefined;
    completed_at?: string | null | undefined;
    agent_id?: string | null | undefined;
    model?: string | null | undefined;
    id?: string | undefined;
    name: string | string;
    arguments: string;
    info?: {
        [k: string]: any;
    } | undefined;
};
/** @internal */
export declare const ToolExecutionEntry$outboundSchema: z.ZodType<ToolExecutionEntry$Outbound, ToolExecutionEntry>;
export declare function toolExecutionEntryToJSON(toolExecutionEntry: ToolExecutionEntry): string;
export declare function toolExecutionEntryFromJSON(jsonString: string): SafeParseResult<ToolExecutionEntry, SDKValidationError>;
//# sourceMappingURL=toolexecutionentry.d.ts.map