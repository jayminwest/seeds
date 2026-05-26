import * as z from "zod/v4";
export type JobsApiRoutesBatchCancelBatchJobRequest = {
    jobId: string;
};
/** @internal */
export type JobsApiRoutesBatchCancelBatchJobRequest$Outbound = {
    job_id: string;
};
/** @internal */
export declare const JobsApiRoutesBatchCancelBatchJobRequest$outboundSchema: z.ZodType<JobsApiRoutesBatchCancelBatchJobRequest$Outbound, JobsApiRoutesBatchCancelBatchJobRequest>;
export declare function jobsApiRoutesBatchCancelBatchJobRequestToJSON(jobsApiRoutesBatchCancelBatchJobRequest: JobsApiRoutesBatchCancelBatchJobRequest): string;
//# sourceMappingURL=jobsapiroutesbatchcancelbatchjob.d.ts.map