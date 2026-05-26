import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ExportDatasetResponse = {
    fileUrl: string;
};
/** @internal */
export declare const ExportDatasetResponse$inboundSchema: z.ZodType<ExportDatasetResponse, unknown>;
export declare function exportDatasetResponseFromJSON(jsonString: string): SafeParseResult<ExportDatasetResponse, SDKValidationError>;
//# sourceMappingURL=exportdatasetresponse.d.ts.map