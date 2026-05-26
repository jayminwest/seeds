import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Library } from "./library.js";
import { PaginationInfo } from "./paginationinfo.js";
export type ListLibrariesResponse = {
    pagination: PaginationInfo;
    data: Array<Library>;
};
/** @internal */
export declare const ListLibrariesResponse$inboundSchema: z.ZodType<ListLibrariesResponse, unknown>;
export declare function listLibrariesResponseFromJSON(jsonString: string): SafeParseResult<ListLibrariesResponse, SDKValidationError>;
//# sourceMappingURL=listlibrariesresponse.d.ts.map