import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const ProcessStatus: {
    readonly SelfManaged: "self_managed";
    readonly MissingContent: "missing_content";
    readonly Noop: "noop";
    readonly Done: "done";
    readonly Todo: "todo";
    readonly InProgress: "in_progress";
    readonly Error: "error";
    readonly WaitingForCapacity: "waiting_for_capacity";
};
export type ProcessStatus = OpenEnum<typeof ProcessStatus>;
/** @internal */
export declare const ProcessStatus$inboundSchema: z.ZodType<ProcessStatus, unknown>;
//# sourceMappingURL=processstatus.d.ts.map