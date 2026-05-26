import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type FieldGroup = {
    name: string;
    label: string;
};
/** @internal */
export declare const FieldGroup$inboundSchema: z.ZodType<FieldGroup, unknown>;
export declare function fieldGroupFromJSON(jsonString: string): SafeParseResult<FieldGroup, SDKValidationError>;
//# sourceMappingURL=fieldgroup.d.ts.map