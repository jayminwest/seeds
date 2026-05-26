import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ChatCompletionEventPreview } from "./chatcompletioneventpreview.js";
export type PaginatedResultChatCompletionEventPreview = {
    results?: Array<ChatCompletionEventPreview> | undefined;
    count: number;
    next?: string | null | undefined;
    previous?: string | null | undefined;
};
/** @internal */
export declare const PaginatedResultChatCompletionEventPreview$inboundSchema: z.ZodType<PaginatedResultChatCompletionEventPreview, unknown>;
export declare function paginatedResultChatCompletionEventPreviewFromJSON(jsonString: string): SafeParseResult<PaginatedResultChatCompletionEventPreview, SDKValidationError>;
//# sourceMappingURL=paginatedresultchatcompletioneventpreview.d.ts.map