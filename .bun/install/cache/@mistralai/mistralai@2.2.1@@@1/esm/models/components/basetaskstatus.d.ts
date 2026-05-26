import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const BaseTaskStatus: {
    readonly Running: "RUNNING";
    readonly Completed: "COMPLETED";
    readonly Failed: "FAILED";
    readonly Canceled: "CANCELED";
    readonly Terminated: "TERMINATED";
    readonly ContinuedAsNew: "CONTINUED_AS_NEW";
    readonly TimedOut: "TIMED_OUT";
    readonly Unknown: "UNKNOWN";
};
export type BaseTaskStatus = OpenEnum<typeof BaseTaskStatus>;
/** @internal */
export declare const BaseTaskStatus$inboundSchema: z.ZodType<BaseTaskStatus, unknown>;
//# sourceMappingURL=basetaskstatus.d.ts.map