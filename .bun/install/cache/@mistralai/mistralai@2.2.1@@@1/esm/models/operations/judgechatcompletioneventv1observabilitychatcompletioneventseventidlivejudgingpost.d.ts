import * as z from "zod/v4";
import * as components from "../components/index.js";
export type JudgeChatCompletionEventV1ObservabilityChatCompletionEventsEventIdLiveJudgingPostRequest = {
    eventId: string;
    judgeChatCompletionEventRequest: components.JudgeChatCompletionEventRequest;
};
/** @internal */
export type JudgeChatCompletionEventV1ObservabilityChatCompletionEventsEventIdLiveJudgingPostRequest$Outbound = {
    event_id: string;
    JudgeChatCompletionEventRequest: components.JudgeChatCompletionEventRequest$Outbound;
};
/** @internal */
export declare const JudgeChatCompletionEventV1ObservabilityChatCompletionEventsEventIdLiveJudgingPostRequest$outboundSchema: z.ZodType<JudgeChatCompletionEventV1ObservabilityChatCompletionEventsEventIdLiveJudgingPostRequest$Outbound, JudgeChatCompletionEventV1ObservabilityChatCompletionEventsEventIdLiveJudgingPostRequest>;
export declare function judgeChatCompletionEventV1ObservabilityChatCompletionEventsEventIdLiveJudgingPostRequestToJSON(judgeChatCompletionEventV1ObservabilityChatCompletionEventsEventIdLiveJudgingPostRequest: JudgeChatCompletionEventV1ObservabilityChatCompletionEventsEventIdLiveJudgingPostRequest): string;
//# sourceMappingURL=judgechatcompletioneventv1observabilitychatcompletioneventseventidlivejudgingpost.d.ts.map