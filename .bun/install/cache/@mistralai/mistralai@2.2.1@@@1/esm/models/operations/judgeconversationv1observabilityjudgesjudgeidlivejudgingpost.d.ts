import * as z from "zod/v4";
import * as components from "../components/index.js";
export type JudgeConversationV1ObservabilityJudgesJudgeIdLiveJudgingPostRequest = {
    judgeId: string;
    judgeConversationRequest: components.JudgeConversationRequest;
};
/** @internal */
export type JudgeConversationV1ObservabilityJudgesJudgeIdLiveJudgingPostRequest$Outbound = {
    judge_id: string;
    JudgeConversationRequest: components.JudgeConversationRequest$Outbound;
};
/** @internal */
export declare const JudgeConversationV1ObservabilityJudgesJudgeIdLiveJudgingPostRequest$outboundSchema: z.ZodType<JudgeConversationV1ObservabilityJudgesJudgeIdLiveJudgingPostRequest$Outbound, JudgeConversationV1ObservabilityJudgesJudgeIdLiveJudgingPostRequest>;
export declare function judgeConversationV1ObservabilityJudgesJudgeIdLiveJudgingPostRequestToJSON(judgeConversationV1ObservabilityJudgesJudgeIdLiveJudgingPostRequest: JudgeConversationV1ObservabilityJudgesJudgeIdLiveJudgingPostRequest): string;
//# sourceMappingURL=judgeconversationv1observabilityjudgesjudgeidlivejudgingpost.d.ts.map