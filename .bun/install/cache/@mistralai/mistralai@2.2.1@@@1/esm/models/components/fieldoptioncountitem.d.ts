import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type FieldOptionCountItem = {
    value: string;
    count: number;
};
/** @internal */
export declare const FieldOptionCountItem$inboundSchema: z.ZodType<FieldOptionCountItem, unknown>;
export declare function fieldOptionCountItemFromJSON(jsonString: string): SafeParseResult<FieldOptionCountItem, SDKValidationError>;
//# sourceMappingURL=fieldoptioncountitem.d.ts.map