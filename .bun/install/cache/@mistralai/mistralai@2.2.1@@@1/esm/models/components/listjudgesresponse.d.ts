import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PaginatedResultJudgePreview } from "./paginatedresultjudgepreview.js";
export type ListJudgesResponse = {
    judges: PaginatedResultJudgePreview;
};
/** @internal */
export declare const ListJudgesResponse$inboundSchema: z.ZodType<ListJudgesResponse, unknown>;
export declare function listJudgesResponseFromJSON(jsonString: string): SafeParseResult<ListJudgesResponse, SDKValidationError>;
//# sourceMappingURL=listjudgesresponse.d.ts.map