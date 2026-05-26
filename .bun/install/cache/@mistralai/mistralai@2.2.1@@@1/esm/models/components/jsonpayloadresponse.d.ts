import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * A payload containing arbitrary JSON data.
 *
 * @remarks
 *
 * Used for complete state snapshots or final results.
 */
export type JSONPayloadResponse = {
    /**
     * Discriminator indicating this is a raw JSON payload.
     */
    type: "json";
    /**
     * The JSON-serializable payload value.
     */
    value: any;
};
/** @internal */
export declare const JSONPayloadResponse$inboundSchema: z.ZodType<JSONPayloadResponse, unknown>;
export declare function jsonPayloadResponseFromJSON(jsonString: string): SafeParseResult<JSONPayloadResponse, SDKValidationError>;
//# sourceMappingURL=jsonpayloadresponse.d.ts.map