import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { OutputContentChunks } from "./outputcontentchunks.js";
export type MessageOutputEventContent = string | OutputContentChunks;
export type MessageOutputEvent = {
    type: "message.output.delta";
    createdAt?: Date | undefined;
    outputIndex: number;
    id: string;
    contentIndex: number;
    model?: string | null | undefined;
    agentId?: string | null | undefined;
    role: "assistant";
    content: string | OutputContentChunks;
};
/** @internal */
export declare const MessageOutputEventContent$inboundSchema: z.ZodType<MessageOutputEventContent, unknown>;
export declare function messageOutputEventContentFromJSON(jsonString: string): SafeParseResult<MessageOutputEventContent, SDKValidationError>;
/** @internal */
export declare const MessageOutputEvent$inboundSchema: z.ZodType<MessageOutputEvent, unknown>;
export declare function messageOutputEventFromJSON(jsonString: string): SafeParseResult<MessageOutputEvent, SDKValidationError>;
//# sourceMappingURL=messageoutputevent.d.ts.map