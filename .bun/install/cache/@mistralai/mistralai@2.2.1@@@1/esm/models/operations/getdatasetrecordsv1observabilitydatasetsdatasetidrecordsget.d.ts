import * as z from "zod/v4";
export type GetDatasetRecordsV1ObservabilityDatasetsDatasetIdRecordsGetRequest = {
    datasetId: string;
    pageSize?: number | undefined;
    page?: number | undefined;
};
/** @internal */
export type GetDatasetRecordsV1ObservabilityDatasetsDatasetIdRecordsGetRequest$Outbound = {
    dataset_id: string;
    page_size: number;
    page: number;
};
/** @internal */
export declare const GetDatasetRecordsV1ObservabilityDatasetsDatasetIdRecordsGetRequest$outboundSchema: z.ZodType<GetDatasetRecordsV1ObservabilityDatasetsDatasetIdRecordsGetRequest$Outbound, GetDatasetRecordsV1ObservabilityDatasetsDatasetIdRecordsGetRequest>;
export declare function getDatasetRecordsV1ObservabilityDatasetsDatasetIdRecordsGetRequestToJSON(getDatasetRecordsV1ObservabilityDatasetsDatasetIdRecordsGetRequest: GetDatasetRecordsV1ObservabilityDatasetsDatasetIdRecordsGetRequest): string;
//# sourceMappingURL=getdatasetrecordsv1observabilitydatasetsdatasetidrecordsget.d.ts.map