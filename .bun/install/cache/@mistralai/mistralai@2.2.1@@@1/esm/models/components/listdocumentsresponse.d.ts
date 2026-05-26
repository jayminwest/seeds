import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Document } from "./document.js";
import { PaginationInfo } from "./paginationinfo.js";
export type ListDocumentsResponse = {
    pagination: PaginationInfo;
    data: Array<Document>;
};
/** @internal */
export declare const ListDocumentsResponse$inboundSchema: z.ZodType<ListDocumentsResponse, unknown>;
export declare function listDocumentsResponseFromJSON(jsonString: string): SafeParseResult<ListDocumentsResponse, SDKValidationError>;
//# sourceMappingURL=listdocumentsresponse.d.ts.map