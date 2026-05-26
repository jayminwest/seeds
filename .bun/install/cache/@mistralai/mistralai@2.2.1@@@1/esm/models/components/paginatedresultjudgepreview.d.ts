import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Judge } from "./judge.js";
export type PaginatedResultJudgePreview = {
    results?: Array<Judge> | undefined;
    count: number;
    next?: string | null | undefined;
    previous?: string | null | undefined;
};
/** @internal */
export declare const PaginatedResultJudgePreview$inboundSchema: z.ZodType<PaginatedResultJudgePreview, unknown>;
export declare function paginatedResultJudgePreviewFromJSON(jsonString: string): SafeParseResult<PaginatedResultJudgePreview, SDKValidationError>;
//# sourceMappingURL=paginatedresultjudgepreview.d.ts.map