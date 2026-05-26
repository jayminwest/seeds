import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ClassificationTargetResult } from "./classificationtargetresult.js";
export type ClassificationResponse = {
    id: string;
    model: string;
    results: Array<{
        [k: string]: ClassificationTargetResult;
    }>;
};
/** @internal */
export declare const ClassificationResponse$inboundSchema: z.ZodType<ClassificationResponse, unknown>;
export declare function classificationResponseFromJSON(jsonString: string): SafeParseResult<ClassificationResponse, SDKValidationError>;
//# sourceMappingURL=classificationresponse.d.ts.map