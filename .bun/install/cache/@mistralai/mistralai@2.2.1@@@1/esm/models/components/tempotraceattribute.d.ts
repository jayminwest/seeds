import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { TempoTraceAttributeArrayValue } from "./tempotraceattributearrayvalue.js";
import { TempoTraceAttributeBoolValue } from "./tempotraceattributeboolvalue.js";
import { TempoTraceAttributeIntValue } from "./tempotraceattributeintvalue.js";
import { TempoTraceAttributeStringValue } from "./tempotraceattributestringvalue.js";
/**
 * The value of the attribute
 */
export type TempoTraceAttributeValue = TempoTraceAttributeStringValue | TempoTraceAttributeIntValue | TempoTraceAttributeBoolValue | TempoTraceAttributeArrayValue;
export type TempoTraceAttribute = {
    /**
     * The key of the attribute
     */
    key: string;
    /**
     * The value of the attribute
     */
    value: TempoTraceAttributeStringValue | TempoTraceAttributeIntValue | TempoTraceAttributeBoolValue | TempoTraceAttributeArrayValue;
};
/** @internal */
export declare const TempoTraceAttributeValue$inboundSchema: z.ZodType<TempoTraceAttributeValue, unknown>;
export declare function tempoTraceAttributeValueFromJSON(jsonString: string): SafeParseResult<TempoTraceAttributeValue, SDKValidationError>;
/** @internal */
export declare const TempoTraceAttribute$inboundSchema: z.ZodType<TempoTraceAttribute, unknown>;
export declare function tempoTraceAttributeFromJSON(jsonString: string): SafeParseResult<TempoTraceAttribute, SDKValidationError>;
//# sourceMappingURL=tempotraceattribute.d.ts.map