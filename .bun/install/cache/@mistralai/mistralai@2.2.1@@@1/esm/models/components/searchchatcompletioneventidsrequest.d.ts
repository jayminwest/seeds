import * as z from "zod/v4";
import { FilterPayload, FilterPayload$Outbound } from "./filterpayload.js";
export type SearchChatCompletionEventIdsRequest = {
    searchParams: FilterPayload;
    extraFields?: Array<string> | null | undefined;
};
/** @internal */
export type SearchChatCompletionEventIdsRequest$Outbound = {
    search_params: FilterPayload$Outbound;
    extra_fields?: Array<string> | null | undefined;
};
/** @internal */
export declare const SearchChatCompletionEventIdsRequest$outboundSchema: z.ZodType<SearchChatCompletionEventIdsRequest$Outbound, SearchChatCompletionEventIdsRequest>;
export declare function searchChatCompletionEventIdsRequestToJSON(searchChatCompletionEventIdsRequest: SearchChatCompletionEventIdsRequest): string;
//# sourceMappingURL=searchchatcompletioneventidsrequest.d.ts.map