import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const EventProgressStatus: {
    readonly Running: "RUNNING";
    readonly Completed: "COMPLETED";
    readonly Failed: "FAILED";
};
export type EventProgressStatus = OpenEnum<typeof EventProgressStatus>;
/** @internal */
export declare const EventProgressStatus$inboundSchema: z.ZodType<EventProgressStatus, unknown>;
//# sourceMappingURL=eventprogressstatus.d.ts.map