import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { TempoTraceAttribute } from "./tempotraceattribute.js";
export type TempoTraceResource = {
    /**
     * The attributes of the resource
     */
    attributes?: Array<TempoTraceAttribute> | undefined;
};
/** @internal */
export declare const TempoTraceResource$inboundSchema: z.ZodType<TempoTraceResource, unknown>;
export declare function tempoTraceResourceFromJSON(jsonString: string): SafeParseResult<TempoTraceResource, SDKValidationError>;
//# sourceMappingURL=tempotraceresource.d.ts.map