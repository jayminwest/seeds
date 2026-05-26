import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type BatchExecutionResult = {
    /**
     * Status of the operation (success/failure)
     */
    status: string;
    /**
     * Error message if operation failed
     */
    error?: string | null | undefined;
};
/** @internal */
export declare const BatchExecutionResult$inboundSchema: z.ZodType<BatchExecutionResult, unknown>;
export declare function batchExecutionResultFromJSON(jsonString: string): SafeParseResult<BatchExecutionResult, SDKValidationError>;
//# sourceMappingURL=batchexecutionresult.d.ts.map