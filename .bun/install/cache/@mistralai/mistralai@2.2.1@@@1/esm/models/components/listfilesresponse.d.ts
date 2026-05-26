import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { FileSchema } from "./fileschema.js";
export type ListFilesResponse = {
    data: Array<FileSchema>;
    object: string;
    total?: number | null | undefined;
};
/** @internal */
export declare const ListFilesResponse$inboundSchema: z.ZodType<ListFilesResponse, unknown>;
export declare function listFilesResponseFromJSON(jsonString: string): SafeParseResult<ListFilesResponse, SDKValidationError>;
//# sourceMappingURL=listfilesresponse.d.ts.map