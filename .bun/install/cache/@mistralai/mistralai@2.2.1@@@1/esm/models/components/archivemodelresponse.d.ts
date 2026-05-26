import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ArchiveModelResponse = {
    id: string;
    object: "model";
    archived: boolean;
};
/** @internal */
export declare const ArchiveModelResponse$inboundSchema: z.ZodType<ArchiveModelResponse, unknown>;
export declare function archiveModelResponseFromJSON(jsonString: string): SafeParseResult<ArchiveModelResponse, SDKValidationError>;
//# sourceMappingURL=archivemodelresponse.d.ts.map