import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const BatchJobStatus: {
    readonly Queued: "QUEUED";
    readonly Running: "RUNNING";
    readonly Success: "SUCCESS";
    readonly Failed: "FAILED";
    readonly TimeoutExceeded: "TIMEOUT_EXCEEDED";
    readonly CancellationRequested: "CANCELLATION_REQUESTED";
    readonly Cancelled: "CANCELLED";
};
export type BatchJobStatus = OpenEnum<typeof BatchJobStatus>;
/** @internal */
export declare const BatchJobStatus$inboundSchema: z.ZodType<BatchJobStatus, unknown>;
/** @internal */
export declare const BatchJobStatus$outboundSchema: z.ZodType<string, BatchJobStatus>;
//# sourceMappingURL=batchjobstatus.d.ts.map