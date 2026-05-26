import * as z from "zod/v4";
import * as components from "../components/index.js";
export type PostDatasetRecordsFromDatasetV1ObservabilityDatasetsDatasetIdImportsFromDatasetPostRequest = {
    datasetId: string;
    importDatasetFromDatasetRequest: components.ImportDatasetFromDatasetRequest;
};
/** @internal */
export type PostDatasetRecordsFromDatasetV1ObservabilityDatasetsDatasetIdImportsFromDatasetPostRequest$Outbound = {
    dataset_id: string;
    ImportDatasetFromDatasetRequest: components.ImportDatasetFromDatasetRequest$Outbound;
};
/** @internal */
export declare const PostDatasetRecordsFromDatasetV1ObservabilityDatasetsDatasetIdImportsFromDatasetPostRequest$outboundSchema: z.ZodType<PostDatasetRecordsFromDatasetV1ObservabilityDatasetsDatasetIdImportsFromDatasetPostRequest$Outbound, PostDatasetRecordsFromDatasetV1ObservabilityDatasetsDatasetIdImportsFromDatasetPostRequest>;
export declare function postDatasetRecordsFromDatasetV1ObservabilityDatasetsDatasetIdImportsFromDatasetPostRequestToJSON(postDatasetRecordsFromDatasetV1ObservabilityDatasetsDatasetIdImportsFromDatasetPostRequest: PostDatasetRecordsFromDatasetV1ObservabilityDatasetsDatasetIdImportsFromDatasetPostRequest): string;
//# sourceMappingURL=postdatasetrecordsfromdatasetv1observabilitydatasetsdatasetidimportsfromdatasetpost.d.ts.map