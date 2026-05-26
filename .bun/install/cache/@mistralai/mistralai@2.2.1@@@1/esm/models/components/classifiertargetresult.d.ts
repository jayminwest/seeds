import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { FTClassifierLossFunction } from "./ftclassifierlossfunction.js";
export type ClassifierTargetResult = {
    name: string;
    labels: Array<string>;
    weight: number;
    lossFunction: FTClassifierLossFunction;
};
/** @internal */
export declare const ClassifierTargetResult$inboundSchema: z.ZodType<ClassifierTargetResult, unknown>;
export declare function classifierTargetResultFromJSON(jsonString: string): SafeParseResult<ClassifierTargetResult, SDKValidationError>;
//# sourceMappingURL=classifiertargetresult.d.ts.map