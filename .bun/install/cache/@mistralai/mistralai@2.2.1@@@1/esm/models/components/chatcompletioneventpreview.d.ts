import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ChatCompletionEventPreviewExtraFields = boolean | number | number | string | Date | Array<string>;
export type ChatCompletionEventPreview = {
    eventId: string;
    correlationId: string;
    createdAt: Date;
    extraFields: {
        [k: string]: boolean | number | number | string | Date | Array<string> | null;
    };
    nbInputTokens: number;
    nbOutputTokens: number;
};
/** @internal */
export declare const ChatCompletionEventPreviewExtraFields$inboundSchema: z.ZodType<ChatCompletionEventPreviewExtraFields, unknown>;
export declare function chatCompletionEventPreviewExtraFieldsFromJSON(jsonString: string): SafeParseResult<ChatCompletionEventPreviewExtraFields, SDKValidationError>;
/** @internal */
export declare const ChatCompletionEventPreview$inboundSchema: z.ZodType<ChatCompletionEventPreview, unknown>;
export declare function chatCompletionEventPreviewFromJSON(jsonString: string): SafeParseResult<ChatCompletionEventPreview, SDKValidationError>;
//# sourceMappingURL=chatcompletioneventpreview.d.ts.map