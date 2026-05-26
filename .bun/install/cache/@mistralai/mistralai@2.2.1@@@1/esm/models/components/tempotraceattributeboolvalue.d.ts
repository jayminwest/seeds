import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type TempoTraceAttributeBoolValue = {
    /**
     * The boolean value of the attribute
     */
    boolValue: boolean;
};
/** @internal */
export declare const TempoTraceAttributeBoolValue$inboundSchema: z.ZodType<TempoTraceAttributeBoolValue, unknown>;
export declare function tempoTraceAttributeBoolValueFromJSON(jsonString: string): SafeParseResult<TempoTraceAttributeBoolValue, SDKValidationError>;
//# sourceMappingURL=tempotraceattributeboolvalue.d.ts.map