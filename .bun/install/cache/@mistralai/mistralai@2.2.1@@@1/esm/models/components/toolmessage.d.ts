import * as z from "zod/v4";
import { ContentChunk, ContentChunk$Outbound } from "./contentchunk.js";
export type ToolMessageContent = string | Array<ContentChunk>;
export type ToolMessage = {
    role: "tool";
    content: string | Array<ContentChunk> | null;
    toolCallId?: string | null | undefined;
    name?: string | null | undefined;
};
/** @internal */
export type ToolMessageContent$Outbound = string | Array<ContentChunk$Outbound>;
/** @internal */
export declare const ToolMessageContent$outboundSchema: z.ZodType<ToolMessageContent$Outbound, ToolMessageContent>;
export declare function toolMessageContentToJSON(toolMessageContent: ToolMessageContent): string;
/** @internal */
export type ToolMessage$Outbound = {
    role: "tool";
    content: string | Array<ContentChunk$Outbound> | null;
    tool_call_id?: string | null | undefined;
    name?: string | null | undefined;
};
/** @internal */
export declare const ToolMessage$outboundSchema: z.ZodType<ToolMessage$Outbound, ToolMessage>;
export declare function toolMessageToJSON(toolMessage: ToolMessage): string;
//# sourceMappingURL=toolmessage.d.ts.map