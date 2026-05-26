import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type TempoTraceAttributeIntValue = {
    /**
     * The integer value of the attribute
     */
    intValue: string;
};
/** @internal */
export declare const TempoTraceAttributeIntValue$inboundSchema: z.ZodType<TempoTraceAttributeIntValue, unknown>;
export declare function tempoTraceAttributeIntValueFromJSON(jsonString: string): SafeParseResult<TempoTraceAttributeIntValue, SDKValidationError>;
//# sourceMappingURL=tempotraceattributeintvalue.d.ts.map