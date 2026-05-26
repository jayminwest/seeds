import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { TempoTraceScope } from "./tempotracescope.js";
import { TempoTraceSpan } from "./tempotracespan.js";
export type TempoTraceScopeSpan = {
    scope: TempoTraceScope;
    /**
     * The spans of the scope
     */
    spans?: Array<TempoTraceSpan> | undefined;
};
/** @internal */
export declare const TempoTraceScopeSpan$inboundSchema: z.ZodType<TempoTraceScopeSpan, unknown>;
export declare function tempoTraceScopeSpanFromJSON(jsonString: string): SafeParseResult<TempoTraceScopeSpan, SDKValidationError>;
//# sourceMappingURL=tempotracescopespan.d.ts.map