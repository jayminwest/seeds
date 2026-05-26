import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type DeleteBatchJobResponse = {
    id: string;
    object: "batch";
    deleted: boolean;
};
/** @internal */
export declare const DeleteBatchJobResponse$inboundSchema: z.ZodType<DeleteBatchJobResponse, unknown>;
export declare function deleteBatchJobResponseFromJSON(jsonString: string): SafeParseResult<DeleteBatchJobResponse, SDKValidationError>;
//# sourceMappingURL=deletebatchjobresponse.d.ts.map