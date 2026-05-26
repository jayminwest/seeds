import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ScheduleRange, ScheduleRange$Outbound } from "./schedulerange.js";
export type ScheduleCalendar = {
    second?: Array<ScheduleRange> | undefined;
    minute?: Array<ScheduleRange> | undefined;
    hour?: Array<ScheduleRange> | undefined;
    dayOfMonth?: Array<ScheduleRange> | undefined;
    month?: Array<ScheduleRange> | undefined;
    year?: Array<ScheduleRange> | undefined;
    dayOfWeek?: Array<ScheduleRange> | undefined;
    comment?: string | null | undefined;
};
/** @internal */
export declare const ScheduleCalendar$inboundSchema: z.ZodType<ScheduleCalendar, unknown>;
/** @internal */
export type ScheduleCalendar$Outbound = {
    second?: Array<ScheduleRange$Outbound> | undefined;
    minute?: Array<ScheduleRange$Outbound> | undefined;
    hour?: Array<ScheduleRange$Outbound> | undefined;
    day_of_month?: Array<ScheduleRange$Outbound> | undefined;
    month?: Array<ScheduleRange$Outbound> | undefined;
    year?: Array<ScheduleRange$Outbound> | undefined;
    day_of_week?: Array<ScheduleRange$Outbound> | undefined;
    comment?: string | null | undefined;
};
/** @internal */
export declare const ScheduleCalendar$outboundSchema: z.ZodType<ScheduleCalendar$Outbound, ScheduleCalendar>;
export declare function scheduleCalendarToJSON(scheduleCalendar: ScheduleCalendar): string;
export declare function scheduleCalendarFromJSON(jsonString: string): SafeParseResult<ScheduleCalendar, SDKValidationError>;
//# sourceMappingURL=schedulecalendar.d.ts.map