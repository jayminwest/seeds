import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type DeleteModelResponse = {
    /**
     * The ID of the deleted model.
     */
    id: string;
    /**
     * The object type that was deleted
     */
    object: string;
    /**
     * The deletion status
     */
    deleted: boolean;
};
/** @internal */
export declare const DeleteModelResponse$inboundSchema: z.ZodType<DeleteModelResponse, unknown>;
export declare function deleteModelResponseFromJSON(jsonString: string): SafeParseResult<DeleteModelResponse, SDKValidationError>;
//# sourceMappingURL=deletemodelresponse.d.ts.map