import * as z from "zod/v4";
export type JobsApiRoutesBatchDeleteBatchJobRequest = {
    jobId: string;
};
/** @internal */
export type JobsApiRoutesBatchDeleteBatchJobRequest$Outbound = {
    job_id: string;
};
/** @internal */
export declare const JobsApiRoutesBatchDeleteBatchJobRequest$outboundSchema: z.ZodType<JobsApiRoutesBatchDeleteBatchJobRequest$Outbound, JobsApiRoutesBatchDeleteBatchJobRequest>;
export declare function jobsApiRoutesBatchDeleteBatchJobRequestToJSON(jobsApiRoutesBatchDeleteBatchJobRequest: JobsApiRoutesBatchDeleteBatchJobRequest): string;
//# sourceMappingURL=jobsapiroutesbatchdeletebatchjob.d.ts.map