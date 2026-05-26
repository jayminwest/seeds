import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PaginatedResultDatasetImportTask } from "./paginatedresultdatasetimporttask.js";
export type ListDatasetImportTasksResponse = {
    tasks: PaginatedResultDatasetImportTask;
};
/** @internal */
export declare const ListDatasetImportTasksResponse$inboundSchema: z.ZodType<ListDatasetImportTasksResponse, unknown>;
export declare function listDatasetImportTasksResponseFromJSON(jsonString: string): SafeParseResult<ListDatasetImportTasksResponse, SDKValidationError>;
//# sourceMappingURL=listdatasetimporttasksresponse.d.ts.map