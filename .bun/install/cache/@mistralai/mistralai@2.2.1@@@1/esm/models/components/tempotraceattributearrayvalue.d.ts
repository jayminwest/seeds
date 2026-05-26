import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { TempoTraceAttributeArrayContainer } from "./tempotraceattributearraycontainer.js";
export type TempoTraceAttributeArrayValue = {
    arrayValue: TempoTraceAttributeArrayContainer;
};
/** @internal */
export declare const TempoTraceAttributeArrayValue$inboundSchema: z.ZodType<TempoTraceAttributeArrayValue, unknown>;
export declare function tempoTraceAttributeArrayValueFromJSON(jsonString: string): SafeParseResult<TempoTraceAttributeArrayValue, SDKValidationError>;
//# sourceMappingURL=tempotraceattributearrayvalue.d.ts.map