import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DatasetImportTask } from "./datasetimporttask.js";
export type PaginatedResultDatasetImportTask = {
    results?: Array<DatasetImportTask> | undefined;
    count: number;
    next?: string | null | undefined;
    previous?: string | null | undefined;
};
/** @internal */
export declare const PaginatedResultDatasetImportTask$inboundSchema: z.ZodType<PaginatedResultDatasetImportTask, unknown>;
export declare function paginatedResultDatasetImportTaskFromJSON(jsonString: string): SafeParseResult<PaginatedResultDatasetImportTask, SDKValidationError>;
//# sourceMappingURL=paginatedresultdatasetimporttask.d.ts.map