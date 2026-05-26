import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ContentChunk } from "./contentchunk.js";
import { ToolCall } from "./toolcall.js";
export type DeltaMessageContent = string | Array<ContentChunk>;
export type DeltaMessage = {
    role?: string | null | undefined;
    content?: string | Array<ContentChunk> | null | undefined;
    toolCalls?: Array<ToolCall> | null | undefined;
    toolCallId?: string | null | undefined;
    /**
     * If the completion returns multiple messages, this is to specify which message this delta is for.
     */
    index?: number | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export declare const DeltaMessageContent$inboundSchema: z.ZodType<DeltaMessageContent, unknown>;
export declare function deltaMessageContentFromJSON(jsonString: string): SafeParseResult<DeltaMessageContent, SDKValidationError>;
/** @internal */
export declare const DeltaMessage$inboundSchema: z.ZodType<DeltaMessage, unknown>;
export declare function deltaMessageFromJSON(jsonString: string): SafeParseResult<DeltaMessage, SDKValidationError>;
//# sourceMappingURL=deltamessage.d.ts.map