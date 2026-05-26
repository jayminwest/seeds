import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type JobsApiRoutesFineTuningStartFineTuningJobRequest = {
    jobId: string;
};
/**
 * OK
 */
export type JobsApiRoutesFineTuningStartFineTuningJobResponse = components.ClassifierFineTuningJobDetails | components.CompletionFineTuningJobDetails | discriminatedUnionTypes.Unknown<"jobType">;
/** @internal */
export type JobsApiRoutesFineTuningStartFineTuningJobRequest$Outbound = {
    job_id: string;
};
/** @internal */
export declare const JobsApiRoutesFineTuningStartFineTuningJobRequest$outboundSchema: z.ZodType<JobsApiRoutesFineTuningStartFineTuningJobRequest$Outbound, JobsApiRoutesFineTuningStartFineTuningJobRequest>;
export declare function jobsApiRoutesFineTuningStartFineTuningJobRequestToJSON(jobsApiRoutesFineTuningStartFineTuningJobRequest: JobsApiRoutesFineTuningStartFineTuningJobRequest): string;
/** @internal */
export declare const JobsApiRoutesFineTuningStartFineTuningJobResponse$inboundSchema: z.ZodType<JobsApiRoutesFineTuningStartFineTuningJobResponse, unknown>;
export declare function jobsApiRoutesFineTuningStartFineTuningJobResponseFromJSON(jsonString: string): SafeParseResult<JobsApiRoutesFineTuningStartFineTuningJobResponse, SDKValidationError>;
//# sourceMappingURL=jobsapiroutesfinetuningstartfinetuningjob.d.ts.map