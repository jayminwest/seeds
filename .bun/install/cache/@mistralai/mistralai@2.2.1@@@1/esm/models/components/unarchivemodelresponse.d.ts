import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type UnarchiveModelResponse = {
    id: string;
    object: "model";
    archived: boolean;
};
/** @internal */
export declare const UnarchiveModelResponse$inboundSchema: z.ZodType<UnarchiveModelResponse, unknown>;
export declare function unarchiveModelResponseFromJSON(jsonString: string): SafeParseResult<UnarchiveModelResponse, SDKValidationError>;
//# sourceMappingURL=unarchivemodelresponse.d.ts.map