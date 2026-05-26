import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ScheduleOverlapPolicy } from "./scheduleoverlappolicy.js";
export type SchedulePolicy = {
    /**
     * After a Temporal server is unavailable, amount of time in seconds in the past to execute missed actions.
     */
    catchupWindowSeconds?: number | undefined;
    /**
     * Controls what happens when a workflow would be started by a schedule but
     *
     * @remarks
     * one is already running.
     */
    overlap?: ScheduleOverlapPolicy | undefined;
    /**
     * Whether to pause the schedule after a workflow failure.
     */
    pauseOnFailure?: boolean | undefined;
};
/** @internal */
export declare const SchedulePolicy$inboundSchema: z.ZodType<SchedulePolicy, unknown>;
/** @internal */
export type SchedulePolicy$Outbound = {
    catchup_window_seconds: number;
    overlap?: number | undefined;
    pause_on_failure: boolean;
};
/** @internal */
export declare const SchedulePolicy$outboundSchema: z.ZodType<SchedulePolicy$Outbound, SchedulePolicy>;
export declare function schedulePolicyToJSON(schedulePolicy: SchedulePolicy): string;
export declare function schedulePolicyFromJSON(jsonString: string): SafeParseResult<SchedulePolicy, SDKValidationError>;
//# sourceMappingURL=schedulepolicy.d.ts.map