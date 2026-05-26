import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ProcessStatus } from "./processstatus.js";
export type ProcessingStatus = {
    documentId: string;
    processStatus: ProcessStatus;
    processingStatus: string;
};
/** @internal */
export declare const ProcessingStatus$inboundSchema: z.ZodType<ProcessingStatus, unknown>;
export declare function processingStatusFromJSON(jsonString: string): SafeParseResult<ProcessingStatus, SDKValidationError>;
//# sourceMappingURL=processingstatus.d.ts.map