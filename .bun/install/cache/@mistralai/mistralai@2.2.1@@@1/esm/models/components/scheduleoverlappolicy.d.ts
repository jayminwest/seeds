import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
/**
 * Controls what happens when a workflow would be started by a schedule but
 *
 * @remarks
 * one is already running.
 */
export declare const ScheduleOverlapPolicy: {
    readonly One: 1;
    readonly Two: 2;
    readonly Three: 3;
    readonly Four: 4;
    readonly Five: 5;
    readonly Six: 6;
};
/**
 * Controls what happens when a workflow would be started by a schedule but
 *
 * @remarks
 * one is already running.
 */
export type ScheduleOverlapPolicy = OpenEnum<typeof ScheduleOverlapPolicy>;
/** @internal */
export declare const ScheduleOverlapPolicy$inboundSchema: z.ZodType<ScheduleOverlapPolicy, unknown>;
/** @internal */
export declare const ScheduleOverlapPolicy$outboundSchema: z.ZodType<number, ScheduleOverlapPolicy>;
//# sourceMappingURL=scheduleoverlappolicy.d.ts.map