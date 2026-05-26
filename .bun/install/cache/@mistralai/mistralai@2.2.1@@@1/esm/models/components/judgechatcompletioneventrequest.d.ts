import * as z from "zod/v4";
import { CreateJudgeRequest, CreateJudgeRequest$Outbound } from "./createjudgerequest.js";
export type JudgeChatCompletionEventRequest = {
    judgeDefinition: CreateJudgeRequest;
};
/** @internal */
export type JudgeChatCompletionEventRequest$Outbound = {
    judge_definition: CreateJudgeRequest$Outbound;
};
/** @internal */
export declare const JudgeChatCompletionEventRequest$outboundSchema: z.ZodType<JudgeChatCompletionEventRequest$Outbound, JudgeChatCompletionEventRequest>;
export declare function judgeChatCompletionEventRequestToJSON(judgeChatCompletionEventRequest: JudgeChatCompletionEventRequest): string;
//# sourceMappingURL=judgechatcompletioneventrequest.d.ts.map