import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PaginatedResultDatasetPreview } from "./paginatedresultdatasetpreview.js";
export type ListDatasetsResponse = {
    datasets: PaginatedResultDatasetPreview;
};
/** @internal */
export declare const ListDatasetsResponse$inboundSchema: z.ZodType<ListDatasetsResponse, unknown>;
export declare function listDatasetsResponseFromJSON(jsonString: string): SafeParseResult<ListDatasetsResponse, SDKValidationError>;
//# sourceMappingURL=listdatasetsresponse.d.ts.map