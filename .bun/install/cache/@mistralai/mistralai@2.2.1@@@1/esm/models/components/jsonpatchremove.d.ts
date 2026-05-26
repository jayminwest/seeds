import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type JSONPatchRemove = {
    /**
     * A JSON Pointer (RFC 6901) identifying the target location within the document. Can be a string path (e.g., '/foo/bar'), '/', '', or an empty list [] for root-level operations.
     */
    path: string;
    /**
     * The value to use for the operation
     */
    value: any;
    /**
     * Remove operation
     */
    op: "remove";
};
/** @internal */
export declare const JSONPatchRemove$inboundSchema: z.ZodType<JSONPatchRemove, unknown>;
export declare function jsonPatchRemoveFromJSON(jsonString: string): SafeParseResult<JSONPatchRemove, SDKValidationError>;
//# sourceMappingURL=jsonpatchremove.d.ts.map