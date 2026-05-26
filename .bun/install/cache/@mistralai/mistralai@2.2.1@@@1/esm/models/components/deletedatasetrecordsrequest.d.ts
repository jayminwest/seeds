import * as z from "zod/v4";
export type DeleteDatasetRecordsRequest = {
    datasetRecordIds: Array<string>;
};
/** @internal */
export type DeleteDatasetRecordsRequest$Outbound = {
    dataset_record_ids: Array<string>;
};
/** @internal */
export declare const DeleteDatasetRecordsRequest$outboundSchema: z.ZodType<DeleteDatasetRecordsRequest$Outbound, DeleteDatasetRecordsRequest>;
export declare function deleteDatasetRecordsRequestToJSON(deleteDatasetRecordsRequest: DeleteDatasetRecordsRequest): string;
//# sourceMappingURL=deletedatasetrecordsrequest.d.ts.map