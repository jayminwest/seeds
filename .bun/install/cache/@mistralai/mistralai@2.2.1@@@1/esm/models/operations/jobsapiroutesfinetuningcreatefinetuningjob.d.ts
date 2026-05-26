import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ResponseT = components.ClassifierFineTuningJob | components.CompletionFineTuningJob | discriminatedUnionTypes.Unknown<"jobType">;
/**
 * OK
 */
export type JobsApiRoutesFineTuningCreateFineTuningJobResponse = components.LegacyJobMetadata | components.ClassifierFineTuningJob | components.CompletionFineTuningJob | discriminatedUnionTypes.Unknown<"jobType">;
/** @internal */
export declare const ResponseT$inboundSchema: z.ZodType<ResponseT, unknown>;
export declare function responseFromJSON(jsonString: string): SafeParseResult<ResponseT, SDKValidationError>;
/** @internal */
export declare const JobsApiRoutesFineTuningCreateFineTuningJobResponse$inboundSchema: z.ZodType<JobsApiRoutesFineTuningCreateFineTuningJobResponse, unknown>;
export declare function jobsApiRoutesFineTuningCreateFineTuningJobResponseFromJSON(jsonString: string): SafeParseResult<JobsApiRoutesFineTuningCreateFineTuningJobResponse, SDKValidationError>;
//# sourceMappingURL=jobsapiroutesfinetuningcreatefinetuningjob.d.ts.map