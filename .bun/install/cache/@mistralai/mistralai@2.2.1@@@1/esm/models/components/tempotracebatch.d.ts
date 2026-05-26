import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { TempoTraceResource } from "./tempotraceresource.js";
import { TempoTraceScopeSpan } from "./tempotracescopespan.js";
export type TempoTraceBatch = {
    resource: TempoTraceResource;
    /**
     * The spans of the scope
     */
    scopeSpans?: Array<TempoTraceScopeSpan> | undefined;
};
/** @internal */
export declare const TempoTraceBatch$inboundSchema: z.ZodType<TempoTraceBatch, unknown>;
export declare function tempoTraceBatchFromJSON(jsonString: string): SafeParseResult<TempoTraceBatch, SDKValidationError>;
//# sourceMappingURL=tempotracebatch.d.ts.map