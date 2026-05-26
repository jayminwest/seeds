import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ScheduleRange = {
    start: number;
    end?: number | undefined;
    step?: number | undefined;
};
/** @internal */
export declare const ScheduleRange$inboundSchema: z.ZodType<ScheduleRange, unknown>;
/** @internal */
export type ScheduleRange$Outbound = {
    start: number;
    end: number;
    step: number;
};
/** @internal */
export declare const ScheduleRange$outboundSchema: z.ZodType<ScheduleRange$Outbound, ScheduleRange>;
export declare function scheduleRangeToJSON(scheduleRange: ScheduleRange): string;
export declare function scheduleRangeFromJSON(jsonString: string): SafeParseResult<ScheduleRange, SDKValidationError>;
//# sourceMappingURL=schedulerange.d.ts.map