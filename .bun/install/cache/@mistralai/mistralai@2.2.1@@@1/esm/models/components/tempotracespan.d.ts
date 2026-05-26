import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { TempoTraceAttribute } from "./tempotraceattribute.js";
import { TempoTraceEvent } from "./tempotraceevent.js";
import { TempoTraceScopeKind } from "./tempotracescopekind.js";
export type TempoTraceSpan = {
    /**
     * The trace ID of the scope
     */
    traceId: string;
    /**
     * The span ID of the scope
     */
    spanId: string;
    /**
     * The parent span ID of the scope
     */
    parentSpanId?: string | null | undefined;
    /**
     * The name of the scope
     */
    name: string;
    kind: TempoTraceScopeKind;
    /**
     * The start time of the scope in Unix nano
     */
    startTimeUnixNano: string;
    /**
     * The end time of the scope in Unix nano
     */
    endTimeUnixNano: string;
    /**
     * The attributes of the scope
     */
    attributes?: Array<TempoTraceAttribute> | undefined;
    /**
     * The events of the scope
     */
    events?: Array<TempoTraceEvent> | undefined;
};
/** @internal */
export declare const TempoTraceSpan$inboundSchema: z.ZodType<TempoTraceSpan, unknown>;
export declare function tempoTraceSpanFromJSON(jsonString: string): SafeParseResult<TempoTraceSpan, SDKValidationError>;
//# sourceMappingURL=tempotracespan.d.ts.map