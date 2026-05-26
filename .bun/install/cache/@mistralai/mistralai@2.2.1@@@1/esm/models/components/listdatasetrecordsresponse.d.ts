import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PaginatedResultDatasetRecord } from "./paginatedresultdatasetrecord.js";
export type ListDatasetRecordsResponse = {
    records: PaginatedResultDatasetRecord;
};
/** @internal */
export declare const ListDatasetRecordsResponse$inboundSchema: z.ZodType<ListDatasetRecordsResponse, unknown>;
export declare function listDatasetRecordsResponseFromJSON(jsonString: string): SafeParseResult<ListDatasetRecordsResponse, SDKValidationError>;
//# sourceMappingURL=listdatasetrecordsresponse.d.ts.map