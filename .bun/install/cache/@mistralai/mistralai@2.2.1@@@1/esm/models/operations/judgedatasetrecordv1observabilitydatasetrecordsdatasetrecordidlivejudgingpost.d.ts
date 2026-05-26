import * as z from "zod/v4";
import * as components from "../components/index.js";
export type JudgeDatasetRecordV1ObservabilityDatasetRecordsDatasetRecordIdLiveJudgingPostRequest = {
    datasetRecordId: string;
    judgeDatasetRecordRequest: components.JudgeDatasetRecordRequest;
};
/** @internal */
export type JudgeDatasetRecordV1ObservabilityDatasetRecordsDatasetRecordIdLiveJudgingPostRequest$Outbound = {
    dataset_record_id: string;
    JudgeDatasetRecordRequest: components.JudgeDatasetRecordRequest$Outbound;
};
/** @internal */
export declare const JudgeDatasetRecordV1ObservabilityDatasetRecordsDatasetRecordIdLiveJudgingPostRequest$outboundSchema: z.ZodType<JudgeDatasetRecordV1ObservabilityDatasetRecordsDatasetRecordIdLiveJudgingPostRequest$Outbound, JudgeDatasetRecordV1ObservabilityDatasetRecordsDatasetRecordIdLiveJudgingPostRequest>;
export declare function judgeDatasetRecordV1ObservabilityDatasetRecordsDatasetRecordIdLiveJudgingPostRequestToJSON(judgeDatasetRecordV1ObservabilityDatasetRecordsDatasetRecordIdLiveJudgingPostRequest: JudgeDatasetRecordV1ObservabilityDatasetRecordsDatasetRecordIdLiveJudgingPostRequest): string;
//# sourceMappingURL=judgedatasetrecordv1observabilitydatasetrecordsdatasetrecordidlivejudgingpost.d.ts.map