import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { TempoTraceAttributeArrayElement } from "./tempotraceattributearrayelement.js";
export type TempoTraceAttributeArrayContainer = {
    /**
     * The values of the array
     */
    values?: Array<TempoTraceAttributeArrayElement> | undefined;
};
/** @internal */
export declare const TempoTraceAttributeArrayContainer$inboundSchema: z.ZodType<TempoTraceAttributeArrayContainer, unknown>;
export declare function tempoTraceAttributeArrayContainerFromJSON(jsonString: string): SafeParseResult<TempoTraceAttributeArrayContainer, SDKValidationError>;
//# sourceMappingURL=tempotraceattributearraycontainer.d.ts.map