import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type JSONPatchAdd = {
    /**
     * A JSON Pointer (RFC 6901) identifying the target location within the document. Can be a string path (e.g., '/foo/bar'), '/', '', or an empty list [] for root-level operations.
     */
    path: string;
    /**
     * The value to use for the operation
     */
    value: any;
    /**
     * Add operation
     */
    op: "add";
};
/** @internal */
export declare const JSONPatchAdd$inboundSchema: z.ZodType<JSONPatchAdd, unknown>;
export declare function jsonPatchAddFromJSON(jsonString: string): SafeParseResult<JSONPatchAdd, SDKValidationError>;
//# sourceMappingURL=jsonpatchadd.d.ts.map