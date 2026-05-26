import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type DeleteFileResponse = {
    /**
     * The ID of the deleted file.
     */
    id: string;
    /**
     * The object type that was deleted
     */
    object: string;
    /**
     * The deletion status.
     */
    deleted: boolean;
};
/** @internal */
export declare const DeleteFileResponse$inboundSchema: z.ZodType<DeleteFileResponse, unknown>;
export declare function deleteFileResponseFromJSON(jsonString: string): SafeParseResult<DeleteFileResponse, SDKValidationError>;
//# sourceMappingURL=deletefileresponse.d.ts.map