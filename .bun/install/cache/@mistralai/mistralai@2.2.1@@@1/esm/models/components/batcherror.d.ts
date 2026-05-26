import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type BatchError = {
    message: string;
    count: number;
};
/** @internal */
export declare const BatchError$inboundSchema: z.ZodType<BatchError, unknown>;
export declare function batchErrorFromJSON(jsonString: string): SafeParseResult<BatchError, SDKValidationError>;
//# sourceMappingURL=batcherror.d.ts.map