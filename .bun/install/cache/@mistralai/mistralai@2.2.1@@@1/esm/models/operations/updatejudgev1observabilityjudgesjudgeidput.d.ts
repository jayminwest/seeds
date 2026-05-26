import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdateJudgeV1ObservabilityJudgesJudgeIdPutRequest = {
    judgeId: string;
    updateJudgeRequest: components.UpdateJudgeRequest;
};
/** @internal */
export type UpdateJudgeV1ObservabilityJudgesJudgeIdPutRequest$Outbound = {
    judge_id: string;
    UpdateJudgeRequest: components.UpdateJudgeRequest$Outbound;
};
/** @internal */
export declare const UpdateJudgeV1ObservabilityJudgesJudgeIdPutRequest$outboundSchema: z.ZodType<UpdateJudgeV1ObservabilityJudgesJudgeIdPutRequest$Outbound, UpdateJudgeV1ObservabilityJudgesJudgeIdPutRequest>;
export declare function updateJudgeV1ObservabilityJudgesJudgeIdPutRequestToJSON(updateJudgeV1ObservabilityJudgesJudgeIdPutRequest: UpdateJudgeV1ObservabilityJudgesJudgeIdPutRequest): string;
//# sourceMappingURL=updatejudgev1observabilityjudgesjudgeidput.d.ts.map