import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type JobsApiRoutesFineTuningUpdateFineTunedModelRequest = {
    /**
     * The ID of the model to update.
     */
    modelId: string;
    updateModelRequest: components.UpdateModelRequest;
};
/**
 * OK
 */
export type JobsApiRoutesFineTuningUpdateFineTunedModelResponse = components.ClassifierFineTunedModel | components.CompletionFineTunedModel | discriminatedUnionTypes.Unknown<"modelType">;
/** @internal */
export type JobsApiRoutesFineTuningUpdateFineTunedModelRequest$Outbound = {
    model_id: string;
    UpdateModelRequest: components.UpdateModelRequest$Outbound;
};
/** @internal */
export declare const JobsApiRoutesFineTuningUpdateFineTunedModelRequest$outboundSchema: z.ZodType<JobsApiRoutesFineTuningUpdateFineTunedModelRequest$Outbound, JobsApiRoutesFineTuningUpdateFineTunedModelRequest>;
export declare function jobsApiRoutesFineTuningUpdateFineTunedModelRequestToJSON(jobsApiRoutesFineTuningUpdateFineTunedModelRequest: JobsApiRoutesFineTuningUpdateFineTunedModelRequest): string;
/** @internal */
export declare const JobsApiRoutesFineTuningUpdateFineTunedModelResponse$inboundSchema: z.ZodType<JobsApiRoutesFineTuningUpdateFineTunedModelResponse, unknown>;
export declare function jobsApiRoutesFineTuningUpdateFineTunedModelResponseFromJSON(jsonString: string): SafeParseResult<JobsApiRoutesFineTuningUpdateFineTunedModelResponse, SDKValidationError>;
//# sourceMappingURL=jobsapiroutesfinetuningupdatefinetunedmodel.d.ts.map