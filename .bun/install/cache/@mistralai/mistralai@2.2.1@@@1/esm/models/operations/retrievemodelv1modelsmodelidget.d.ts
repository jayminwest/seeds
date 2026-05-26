import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type RetrieveModelV1ModelsModelIdGetRequest = {
    /**
     * The ID of the model to retrieve.
     */
    modelId: string;
};
/**
 * Successful Response
 */
export type ResponseRetrieveModelV1ModelsModelIdGet = components.BaseModelCard | components.FTModelCard | discriminatedUnionTypes.Unknown<"type">;
/** @internal */
export type RetrieveModelV1ModelsModelIdGetRequest$Outbound = {
    model_id: string;
};
/** @internal */
export declare const RetrieveModelV1ModelsModelIdGetRequest$outboundSchema: z.ZodType<RetrieveModelV1ModelsModelIdGetRequest$Outbound, RetrieveModelV1ModelsModelIdGetRequest>;
export declare function retrieveModelV1ModelsModelIdGetRequestToJSON(retrieveModelV1ModelsModelIdGetRequest: RetrieveModelV1ModelsModelIdGetRequest): string;
/** @internal */
export declare const ResponseRetrieveModelV1ModelsModelIdGet$inboundSchema: z.ZodType<ResponseRetrieveModelV1ModelsModelIdGet, unknown>;
export declare function responseRetrieveModelV1ModelsModelIdGetFromJSON(jsonString: string): SafeParseResult<ResponseRetrieveModelV1ModelsModelIdGet, SDKValidationError>;
//# sourceMappingURL=retrievemodelv1modelsmodelidget.d.ts.map