import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type JudgeClassificationOutputOption = {
    value: string;
    description: string;
};
/** @internal */
export declare const JudgeClassificationOutputOption$inboundSchema: z.ZodType<JudgeClassificationOutputOption, unknown>;
/** @internal */
export type JudgeClassificationOutputOption$Outbound = {
    value: string;
    description: string;
};
/** @internal */
export declare const JudgeClassificationOutputOption$outboundSchema: z.ZodType<JudgeClassificationOutputOption$Outbound, JudgeClassificationOutputOption>;
export declare function judgeClassificationOutputOptionToJSON(judgeClassificationOutputOption: JudgeClassificationOutputOption): string;
export declare function judgeClassificationOutputOptionFromJSON(jsonString: string): SafeParseResult<JudgeClassificationOutputOption, SDKValidationError>;
//# sourceMappingURL=judgeclassificationoutputoption.d.ts.map