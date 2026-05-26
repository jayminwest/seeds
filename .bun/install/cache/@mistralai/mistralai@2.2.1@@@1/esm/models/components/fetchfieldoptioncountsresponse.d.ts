import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { FieldOptionCountItem } from "./fieldoptioncountitem.js";
export type FetchFieldOptionCountsResponse = {
    counts: Array<FieldOptionCountItem>;
};
/** @internal */
export declare const FetchFieldOptionCountsResponse$inboundSchema: z.ZodType<FetchFieldOptionCountsResponse, unknown>;
export declare function fetchFieldOptionCountsResponseFromJSON(jsonString: string): SafeParseResult<FetchFieldOptionCountsResponse, SDKValidationError>;
//# sourceMappingURL=fetchfieldoptioncountsresponse.d.ts.map