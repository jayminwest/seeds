import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { FeedResultChatCompletionEventPreview } from "./feedresultchatcompletioneventpreview.js";
export type SearchChatCompletionEventsResponse = {
    completionEvents: FeedResultChatCompletionEventPreview;
};
/** @internal */
export declare const SearchChatCompletionEventsResponse$inboundSchema: z.ZodType<SearchChatCompletionEventsResponse, unknown>;
export declare function searchChatCompletionEventsResponseFromJSON(jsonString: string): SafeParseResult<SearchChatCompletionEventsResponse, SDKValidationError>;
//# sourceMappingURL=searchchatcompletioneventsresponse.d.ts.map