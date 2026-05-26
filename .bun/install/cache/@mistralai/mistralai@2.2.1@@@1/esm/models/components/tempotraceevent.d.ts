import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { TempoTraceAttribute } from "./tempotraceattribute.js";
export type TempoTraceEvent = {
    /**
     * The name of the event
     */
    name: string;
    /**
     * The time of the event in Unix nano
     */
    timeUnixNano: string;
    /**
     * The attributes of the event
     */
    attributes?: Array<TempoTraceAttribute> | undefined;
};
/** @internal */
export declare const TempoTraceEvent$inboundSchema: z.ZodType<TempoTraceEvent, unknown>;
export declare function tempoTraceEventFromJSON(jsonString: string): SafeParseResult<TempoTraceEvent, SDKValidationError>;
//# sourceMappingURL=tempotraceevent.d.ts.map