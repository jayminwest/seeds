import * as z from "zod/v4";
import { CreateJudgeRequest, CreateJudgeRequest$Outbound } from "./createjudgerequest.js";
export type JudgeDatasetRecordRequest = {
    judgeDefinition: CreateJudgeRequest;
};
/** @internal */
export type JudgeDatasetRecordRequest$Outbound = {
    judge_definition: CreateJudgeRequest$Outbound;
};
/** @internal */
export declare const JudgeDatasetRecordRequest$outboundSchema: z.ZodType<JudgeDatasetRecordRequest$Outbound, JudgeDatasetRecordRequest>;
export declare function judgeDatasetRecordRequestToJSON(judgeDatasetRecordRequest: JudgeDatasetRecordRequest): string;
//# sourceMappingURL=judgedatasetrecordrequest.d.ts.map