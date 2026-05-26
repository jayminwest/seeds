import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdateDatasetV1ObservabilityDatasetsDatasetIdPatchRequest = {
    datasetId: string;
    updateDatasetRequest: components.UpdateDatasetRequest;
};
/** @internal */
export type UpdateDatasetV1ObservabilityDatasetsDatasetIdPatchRequest$Outbound = {
    dataset_id: string;
    UpdateDatasetRequest: components.UpdateDatasetRequest$Outbound;
};
/** @internal */
export declare const UpdateDatasetV1ObservabilityDatasetsDatasetIdPatchRequest$outboundSchema: z.ZodType<UpdateDatasetV1ObservabilityDatasetsDatasetIdPatchRequest$Outbound, UpdateDatasetV1ObservabilityDatasetsDatasetIdPatchRequest>;
export declare function updateDatasetV1ObservabilityDatasetsDatasetIdPatchRequestToJSON(updateDatasetV1ObservabilityDatasetsDatasetIdPatchRequest: UpdateDatasetV1ObservabilityDatasetsDatasetIdPatchRequest): string;
//# sourceMappingURL=updatedatasetv1observabilitydatasetsdatasetidpatch.d.ts.map