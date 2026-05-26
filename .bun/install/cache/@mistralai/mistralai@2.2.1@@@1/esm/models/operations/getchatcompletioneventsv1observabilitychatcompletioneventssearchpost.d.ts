import * as z from "zod/v4";
import * as components from "../components/index.js";
export type GetChatCompletionEventsV1ObservabilityChatCompletionEventsSearchPostRequest = {
    pageSize?: number | undefined;
    cursor?: string | null | undefined;
    searchChatCompletionEventsRequest: components.SearchChatCompletionEventsRequest;
};
/** @internal */
export type GetChatCompletionEventsV1ObservabilityChatCompletionEventsSearchPostRequest$Outbound = {
    page_size: number;
    cursor?: string | null | undefined;
    SearchChatCompletionEventsRequest: components.SearchChatCompletionEventsRequest$Outbound;
};
/** @internal */
export declare const GetChatCompletionEventsV1ObservabilityChatCompletionEventsSearchPostRequest$outboundSchema: z.ZodType<GetChatCompletionEventsV1ObservabilityChatCompletionEventsSearchPostRequest$Outbound, GetChatCompletionEventsV1ObservabilityChatCompletionEventsSearchPostRequest>;
export declare function getChatCompletionEventsV1ObservabilityChatCompletionEventsSearchPostRequestToJSON(getChatCompletionEventsV1ObservabilityChatCompletionEventsSearchPostRequest: GetChatCompletionEventsV1ObservabilityChatCompletionEventsSearchPostRequest): string;
//# sourceMappingURL=getchatcompletioneventsv1observabilitychatcompletioneventssearchpost.d.ts.map