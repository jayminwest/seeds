import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { JSONPatchPayloadResponse } from "./jsonpatchpayloadresponse.js";
import { JSONPayloadResponse } from "./jsonpayloadresponse.js";
/**
 * The current state or incremental update for the task.
 */
export type Payload = (JSONPayloadResponse & {
    type: "json";
}) | JSONPatchPayloadResponse | discriminatedUnionTypes.Unknown<"type">;
/**
 * Attributes for custom task in-progress events with streaming updates.
 */
export type CustomTaskInProgressAttributesResponse = {
    /**
     * Unique identifier for the custom task within the workflow.
     */
    customTaskId: string;
    /**
     * The type/category of the custom task (e.g., 'llm_call', 'api_request').
     */
    customTaskType: string;
    /**
     * The current state or incremental update for the task.
     */
    payload: (JSONPayloadResponse & {
        type: "json";
    }) | JSONPatchPayloadResponse | discriminatedUnionTypes.Unknown<"type">;
};
/** @internal */
export declare const Payload$inboundSchema: z.ZodType<Payload, unknown>;
export declare function payloadFromJSON(jsonString: string): SafeParseResult<Payload, SDKValidationError>;
/** @internal */
export declare const CustomTaskInProgressAttributesResponse$inboundSchema: z.ZodType<CustomTaskInProgressAttributesResponse, unknown>;
export declare function customTaskInProgressAttributesResponseFromJSON(jsonString: string): SafeParseResult<CustomTaskInProgressAttributesResponse, SDKValidationError>;
//# sourceMappingURL=customtaskinprogressattributesresponse.d.ts.map