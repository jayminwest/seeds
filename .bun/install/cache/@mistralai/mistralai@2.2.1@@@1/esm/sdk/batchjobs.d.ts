import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class BatchJobs extends ClientSDK {
    /**
     * Get Batch Jobs
     *
     * @remarks
     * Get a list of batch jobs for your organization and user.
     */
    list(request?: operations.JobsApiRoutesBatchGetBatchJobsRequest | undefined, options?: RequestOptions): Promise<components.ListBatchJobsResponse>;
    /**
     * Create Batch Job
     *
     * @remarks
     * Create a new batch job, it will be queued for processing.
     */
    create(request: components.CreateBatchJobRequest, options?: RequestOptions): Promise<components.BatchJob>;
    /**
     * Get Batch Job
     *
     * @remarks
     * Get a batch job details by its UUID.
     *
     * Args:
     *     inline: If True, return results inline in the response.
     */
    get(request: operations.JobsApiRoutesBatchGetBatchJobRequest, options?: RequestOptions): Promise<components.BatchJob>;
    /**
     * Delete Batch Job
     *
     * @remarks
     * Request the deletion of a batch job.
     */
    delete(request: operations.JobsApiRoutesBatchDeleteBatchJobRequest, options?: RequestOptions): Promise<components.DeleteBatchJobResponse>;
    /**
     * Cancel Batch Job
     *
     * @remarks
     * Request the cancellation of a batch job.
     */
    cancel(request: operations.JobsApiRoutesBatchCancelBatchJobRequest, options?: RequestOptions): Promise<components.BatchJob>;
}
//# sourceMappingURL=batchjobs.d.ts.map