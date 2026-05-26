import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type JSONPatchReplace = {
    /**
     * A JSON Pointer (RFC 6901) identifying the target location within the document. Can be a string path (e.g., '/foo/bar'), '/', '', or an empty list [] for root-level operations.
     */
    path: string;
    /**
     * The value to use for the operation
     */
    value: any;
    /**
     * Replace operation
     */
    op: "replace";
};
/** @internal */
export declare const JSONPatchReplace$inboundSchema: z.ZodType<JSONPatchReplace, unknown>;
export declare function jsonPatchReplaceFromJSON(jsonString: string): SafeParseResult<JSONPatchReplace, SDKValidationError>;
//# sourceMappingURL=jsonpatchreplace.d.ts.map