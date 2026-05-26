import * as z from "zod/v4";
import { FilterPayload, FilterPayload$Outbound } from "./filterpayload.js";
export type SearchChatCompletionEventsRequest = {
    searchParams: FilterPayload;
    extraFields?: Array<string> | null | undefined;
};
/** @internal */
export type SearchChatCompletionEventsRequest$Outbound = {
    search_params: FilterPayload$Outbound;
    extra_fields?: Array<string> | null | undefined;
};
/** @internal */
export declare const SearchChatCompletionEventsRequest$outboundSchema: z.ZodType<SearchChatCompletionEventsRequest$Outbound, SearchChatCompletionEventsRequest>;
export declare function searchChatCompletionEventsRequestToJSON(searchChatCompletionEventsRequest: SearchChatCompletionEventsRequest): string;
//# sourceMappingURL=searchchatcompletioneventsrequest.d.ts.map