import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type TempoTraceAttributeArrayElement = {
    /**
     * A string element in the array
     */
    stringValue?: string | null | undefined;
    /**
     * An integer element in the array
     */
    intValue?: string | null | undefined;
    /**
     * A boolean element in the array
     */
    boolValue?: boolean | null | undefined;
};
/** @internal */
export declare const TempoTraceAttributeArrayElement$inboundSchema: z.ZodType<TempoTraceAttributeArrayElement, unknown>;
export declare function tempoTraceAttributeArrayElementFromJSON(jsonString: string): SafeParseResult<TempoTraceAttributeArrayElement, SDKValidationError>;
//# sourceMappingURL=tempotraceattributearrayelement.d.ts.map