import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type PaginationResponse = {
    nextCursor?: string | null | undefined;
    pageSize: number;
};
/** @internal */
export declare const PaginationResponse$inboundSchema: z.ZodType<PaginationResponse, unknown>;
export declare function paginationResponseFromJSON(jsonString: string): SafeParseResult<PaginationResponse, SDKValidationError>;
//# sourceMappingURL=paginationresponse.d.ts.map