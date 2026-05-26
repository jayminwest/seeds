import * as z from "zod/v4";
export type ImportDatasetFromDatasetRequest = {
    datasetRecordIds: Array<string>;
};
/** @internal */
export type ImportDatasetFromDatasetRequest$Outbound = {
    dataset_record_ids: Array<string>;
};
/** @internal */
export declare const ImportDatasetFromDatasetRequest$outboundSchema: z.ZodType<ImportDatasetFromDatasetRequest$Outbound, ImportDatasetFromDatasetRequest>;
export declare function importDatasetFromDatasetRequestToJSON(importDatasetFromDatasetRequest: ImportDatasetFromDatasetRequest): string;
//# sourceMappingURL=importdatasetfromdatasetrequest.d.ts.map