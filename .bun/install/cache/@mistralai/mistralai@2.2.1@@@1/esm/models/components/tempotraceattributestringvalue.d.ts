import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type TempoTraceAttributeStringValue = {
    /**
     * The string value of the attribute
     */
    stringValue: string;
};
/** @internal */
export declare const TempoTraceAttributeStringValue$inboundSchema: z.ZodType<TempoTraceAttributeStringValue, unknown>;
export declare function tempoTraceAttributeStringValueFromJSON(jsonString: string): SafeParseResult<TempoTraceAttributeStringValue, SDKValidationError>;
//# sourceMappingURL=tempotraceattributestringvalue.d.ts.map