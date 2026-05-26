import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { BatchError } from "./batcherror.js";
import { BatchJobStatus } from "./batchjobstatus.js";
export type BatchJob = {
    id: string;
    object: "batch";
    inputFiles: Array<string>;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    endpoint: string;
    model?: string | null | undefined;
    agentId?: string | null | undefined;
    outputFile?: string | null | undefined;
    errorFile?: string | null | undefined;
    errors: Array<BatchError>;
    outputs?: Array<{
        [k: string]: any;
    }> | null | undefined;
    status: BatchJobStatus;
    createdAt: number;
    totalRequests: number;
    completedRequests: number;
    succeededRequests: number;
    failedRequests: number;
    startedAt?: number | null | undefined;
    completedAt?: number | null | undefined;
};
/** @internal */
export declare const BatchJob$inboundSchema: z.ZodType<BatchJob, unknown>;
export declare function batchJobFromJSON(jsonString: string): SafeParseResult<BatchJob, SDKValidationError>;
//# sourceMappingURL=batchjob.d.ts.map