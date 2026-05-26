import * as z from "zod/v4";
export type GetDatasetImportTaskV1ObservabilityDatasetsDatasetIdTasksTaskIdGetRequest = {
    datasetId: string;
    taskId: string;
};
/** @internal */
export type GetDatasetImportTaskV1ObservabilityDatasetsDatasetIdTasksTaskIdGetRequest$Outbound = {
    dataset_id: string;
    task_id: string;
};
/** @internal */
export declare const GetDatasetImportTaskV1ObservabilityDatasetsDatasetIdTasksTaskIdGetRequest$outboundSchema: z.ZodType<GetDatasetImportTaskV1ObservabilityDatasetsDatasetIdTasksTaskIdGetRequest$Outbound, GetDatasetImportTaskV1ObservabilityDatasetsDatasetIdTasksTaskIdGetRequest>;
export declare function getDatasetImportTaskV1ObservabilityDatasetsDatasetIdTasksTaskIdGetRequestToJSON(getDatasetImportTaskV1ObservabilityDatasetsDatasetIdTasksTaskIdGetRequest: GetDatasetImportTaskV1ObservabilityDatasetsDatasetIdTasksTaskIdGetRequest): string;
//# sourceMappingURL=getdatasetimporttaskv1observabilitydatasetsdatasetidtaskstaskidget.d.ts.map