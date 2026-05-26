import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Represents an error or exception that occurred during execution.
 */
export type Failure = {
    /**
     * A human-readable description of the failure.
     */
    message: string;
};
/** @internal */
export declare const Failure$inboundSchema: z.ZodType<Failure, unknown>;
export declare function failureFromJSON(jsonString: string): SafeParseResult<Failure, SDKValidationError>;
//# sourceMappingURL=failure.d.ts.map