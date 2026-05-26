import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { BatchExecutionResult } from "./batchexecutionresult.js";
export type BatchExecutionResponse = {
    /**
     * Mapping of execution_id to result with status and optional error message
     */
    results?: {
        [k: string]: BatchExecutionResult;
    } | undefined;
};
/** @internal */
export declare const BatchExecutionResponse$inboundSchema: z.ZodType<BatchExecutionResponse, unknown>;
export declare function batchExecutionResponseFromJSON(jsonString: string): SafeParseResult<BatchExecutionResponse, SDKValidationError>;
//# sourceMappingURL=batchexecutionresponse.d.ts.map