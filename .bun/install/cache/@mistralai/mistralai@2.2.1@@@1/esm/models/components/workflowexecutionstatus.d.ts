import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const WorkflowExecutionStatus: {
    readonly Running: "RUNNING";
    readonly Completed: "COMPLETED";
    readonly Failed: "FAILED";
    readonly Canceled: "CANCELED";
    readonly Terminated: "TERMINATED";
    readonly ContinuedAsNew: "CONTINUED_AS_NEW";
    readonly TimedOut: "TIMED_OUT";
    readonly RetryingAfterError: "RETRYING_AFTER_ERROR";
};
export type WorkflowExecutionStatus = OpenEnum<typeof WorkflowExecutionStatus>;
/** @internal */
export declare const WorkflowExecutionStatus$inboundSchema: z.ZodType<WorkflowExecutionStatus, unknown>;
/** @internal */
export declare const WorkflowExecutionStatus$outboundSchema: z.ZodType<string, WorkflowExecutionStatus>;
//# sourceMappingURL=workflowexecutionstatus.d.ts.map