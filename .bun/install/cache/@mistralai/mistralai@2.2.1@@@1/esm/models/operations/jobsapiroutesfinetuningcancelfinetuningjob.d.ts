import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type JobsApiRoutesFineTuningCancelFineTuningJobRequest = {
    /**
     * The ID of the job to cancel.
     */
    jobId: string;
};
/**
 * OK
 */
export type JobsApiRoutesFineTuningCancelFineTuningJobResponse = components.ClassifierFineTuningJobDetails | components.CompletionFineTuningJobDetails | discriminatedUnionTypes.Unknown<"jobType">;
/** @internal */
export type JobsApiRoutesFineTuningCancelFineTuningJobRequest$Outbound = {
    job_id: string;
};
/** @internal */
export declare const JobsApiRoutesFineTuningCancelFineTuningJobRequest$outboundSchema: z.ZodType<JobsApiRoutesFineTuningCancelFineTuningJobRequest$Outbound, JobsApiRoutesFineTuningCancelFineTuningJobRequest>;
export declare function jobsApiRoutesFineTuningCancelFineTuningJobRequestToJSON(jobsApiRoutesFineTuningCancelFineTuningJobRequest: JobsApiRoutesFineTuningCancelFineTuningJobRequest): string;
/** @internal */
export declare const JobsApiRoutesFineTuningCancelFineTuningJobResponse$inboundSchema: z.ZodType<JobsApiRoutesFineTuningCancelFineTuningJobResponse, unknown>;
export declare function jobsApiRoutesFineTuningCancelFineTuningJobResponseFromJSON(jsonString: string): SafeParseResult<JobsApiRoutesFineTuningCancelFineTuningJobResponse, SDKValidationError>;
//# sourceMappingURL=jobsapiroutesfinetuningcancelfinetuningjob.d.ts.map