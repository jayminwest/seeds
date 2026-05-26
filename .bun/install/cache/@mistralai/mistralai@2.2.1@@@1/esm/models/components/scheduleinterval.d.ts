import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ScheduleInterval = {
    every: string;
    offset?: string | null | undefined;
};
/** @internal */
export declare const ScheduleInterval$inboundSchema: z.ZodType<ScheduleInterval, unknown>;
/** @internal */
export type ScheduleInterval$Outbound = {
    every: string;
    offset?: string | null | undefined;
};
/** @internal */
export declare const ScheduleInterval$outboundSchema: z.ZodType<ScheduleInterval$Outbound, ScheduleInterval>;
export declare function scheduleIntervalToJSON(scheduleInterval: ScheduleInterval): string;
export declare function scheduleIntervalFromJSON(jsonString: string): SafeParseResult<ScheduleInterval, SDKValidationError>;
//# sourceMappingURL=scheduleinterval.d.ts.map