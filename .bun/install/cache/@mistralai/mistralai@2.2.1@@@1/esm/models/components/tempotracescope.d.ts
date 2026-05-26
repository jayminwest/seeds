import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type TempoTraceScope = {
    /**
     * The name of the span
     */
    name: string;
};
/** @internal */
export declare const TempoTraceScope$inboundSchema: z.ZodType<TempoTraceScope, unknown>;
export declare function tempoTraceScopeFromJSON(jsonString: string): SafeParseResult<TempoTraceScope, SDKValidationError>;
//# sourceMappingURL=tempotracescope.d.ts.map