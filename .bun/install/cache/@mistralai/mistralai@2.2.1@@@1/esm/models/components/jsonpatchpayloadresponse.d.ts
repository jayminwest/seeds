import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { JSONPatchAdd } from "./jsonpatchadd.js";
import { JSONPatchAppend } from "./jsonpatchappend.js";
import { JSONPatchRemove } from "./jsonpatchremove.js";
import { JSONPatchReplace } from "./jsonpatchreplace.js";
export type JSONPatchPayloadResponseValue = JSONPatchAdd | JSONPatchAppend | JSONPatchRemove | JSONPatchReplace | discriminatedUnionTypes.Unknown<"op">;
/**
 * A payload containing a list of JSON Patch operations.
 *
 * @remarks
 *
 * Used for streaming incremental updates to workflow state.
 */
export type JSONPatchPayloadResponse = {
    /**
     * Discriminator indicating this is a JSON Patch payload.
     */
    type: "json_patch";
    /**
     * The list of JSON Patch operations to apply in order.
     */
    value: Array<JSONPatchAdd | JSONPatchAppend | JSONPatchRemove | JSONPatchReplace | discriminatedUnionTypes.Unknown<"op">>;
};
/** @internal */
export declare const JSONPatchPayloadResponseValue$inboundSchema: z.ZodType<JSONPatchPayloadResponseValue, unknown>;
export declare function jsonPatchPayloadResponseValueFromJSON(jsonString: string): SafeParseResult<JSONPatchPayloadResponseValue, SDKValidationError>;
/** @internal */
export declare const JSONPatchPayloadResponse$inboundSchema: z.ZodType<JSONPatchPayloadResponse, unknown>;
export declare function jsonPatchPayloadResponseFromJSON(jsonString: string): SafeParseResult<JSONPatchPayloadResponse, SDKValidationError>;
//# sourceMappingURL=jsonpatchpayloadresponse.d.ts.map