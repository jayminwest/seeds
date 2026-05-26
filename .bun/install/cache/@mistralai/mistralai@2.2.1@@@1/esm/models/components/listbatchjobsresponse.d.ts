import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { BatchJob } from "./batchjob.js";
export type ListBatchJobsResponse = {
    data?: Array<BatchJob> | undefined;
    object: "list";
    total: number;
};
/** @internal */
export declare const ListBatchJobsResponse$inboundSchema: z.ZodType<ListBatchJobsResponse, unknown>;
export declare function listBatchJobsResponseFromJSON(jsonString: string): SafeParseResult<ListBatchJobsResponse, SDKValidationError>;
//# sourceMappingURL=listbatchjobsresponse.d.ts.map