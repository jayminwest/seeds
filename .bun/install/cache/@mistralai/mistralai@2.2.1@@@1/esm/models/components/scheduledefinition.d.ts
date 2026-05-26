import * as z from "zod/v4";
import { ScheduleCalendar, ScheduleCalendar$Outbound } from "./schedulecalendar.js";
import { ScheduleInterval, ScheduleInterval$Outbound } from "./scheduleinterval.js";
import { SchedulePolicy, SchedulePolicy$Outbound } from "./schedulepolicy.js";
/**
 * Specification of the times scheduled actions may occur.
 *
 * @remarks
 *
 * The times are the union of :py:attr:`calendars`, :py:attr:`intervals`, and
 * :py:attr:`cron_expressions` excluding anything in :py:attr:`skip`.
 *
 * Used for input where schedule_id is optional (can be provided or auto-generated).
 */
export type ScheduleDefinition = {
    /**
     * Input to provide to the workflow when starting it.
     */
    input: any;
    /**
     * Calendar-based specification of times.
     */
    calendars?: Array<ScheduleCalendar> | undefined;
    /**
     * Interval-based specification of times.
     */
    intervals?: Array<ScheduleInterval> | undefined;
    /**
     * Cron-based specification of times.
     */
    cronExpressions?: Array<string> | undefined;
    /**
     * Set of calendar times to skip.
     */
    skip?: Array<ScheduleCalendar> | undefined;
    /**
     * Time after which the first action may be run.
     */
    startAt?: Date | null | undefined;
    /**
     * Time after which no more actions will be run.
     */
    endAt?: Date | null | undefined;
    /**
     * Jitter to apply each action.
     *
     * @remarks
     *
     * An action's scheduled time will be incremented by a random value between 0
     * and this value if present (but not past the next schedule).
     */
    jitter?: string | null | undefined;
    /**
     * IANA time zone name, for example ``US/Central``.
     */
    timeZoneName?: string | null | undefined;
    policy?: SchedulePolicy | undefined;
    /**
     * Unique identifier for the schedule.
     */
    scheduleId?: string | null | undefined;
};
/** @internal */
export type ScheduleDefinition$Outbound = {
    input: any;
    calendars?: Array<ScheduleCalendar$Outbound> | undefined;
    intervals?: Array<ScheduleInterval$Outbound> | undefined;
    cron_expressions?: Array<string> | undefined;
    skip?: Array<ScheduleCalendar$Outbound> | undefined;
    start_at?: string | null | undefined;
    end_at?: string | null | undefined;
    jitter?: string | null | undefined;
    time_zone_name?: string | null | undefined;
    policy?: SchedulePolicy$Outbound | undefined;
    schedule_id?: string | null | undefined;
};
/** @internal */
export declare const ScheduleDefinition$outboundSchema: z.ZodType<ScheduleDefinition$Outbound, ScheduleDefinition>;
export declare function scheduleDefinitionToJSON(scheduleDefinition: ScheduleDefinition): string;
//# sourceMappingURL=scheduledefinition.d.ts.map