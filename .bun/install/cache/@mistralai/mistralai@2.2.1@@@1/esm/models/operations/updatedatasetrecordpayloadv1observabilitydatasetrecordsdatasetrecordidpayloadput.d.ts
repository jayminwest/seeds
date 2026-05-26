import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdateDatasetRecordPayloadV1ObservabilityDatasetRecordsDatasetRecordIdPayloadPutRequest = {
    datasetRecordId: string;
    updateDatasetRecordPayloadRequest: components.UpdateDatasetRecordPayloadRequest;
};
/** @internal */
export type UpdateDatasetRecordPayloadV1ObservabilityDatasetRecordsDatasetRecordIdPayloadPutRequest$Outbound = {
    dataset_record_id: string;
    UpdateDatasetRecordPayloadRequest: components.UpdateDatasetRecordPayloadRequest$Outbound;
};
/** @internal */
export declare const UpdateDatasetRecordPayloadV1ObservabilityDatasetRecordsDatasetRecordIdPayloadPutRequest$outboundSchema: z.ZodType<UpdateDatasetRecordPayloadV1ObservabilityDatasetRecordsDatasetRecordIdPayloadPutRequest$Outbound, UpdateDatasetRecordPayloadV1ObservabilityDatasetRecordsDatasetRecordIdPayloadPutRequest>;
export declare function updateDatasetRecordPayloadV1ObservabilityDatasetRecordsDatasetRecordIdPayloadPutRequestToJSON(updateDatasetRecordPayloadV1ObservabilityDatasetRecordsDatasetRecordIdPayloadPutRequest: UpdateDatasetRecordPayloadV1ObservabilityDatasetRecordsDatasetRecordIdPayloadPutRequest): string;
//# sourceMappingURL=updatedatasetrecordpayloadv1observabilitydatasetrecordsdatasetrecordidpayloadput.d.ts.map