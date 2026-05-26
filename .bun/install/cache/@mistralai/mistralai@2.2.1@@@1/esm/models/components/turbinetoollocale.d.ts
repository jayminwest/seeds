import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type TurbineToolLocale = {
    name?: {
        [k: string]: string;
    } | null | undefined;
    description?: {
        [k: string]: string;
    } | null | undefined;
    usageSentence?: {
        [k: string]: string;
    } | null | undefined;
    workingDescription?: {
        [k: string]: string;
    } | null | undefined;
    doneDescription?: {
        [k: string]: string;
    } | null | undefined;
};
/** @internal */
export declare const TurbineToolLocale$inboundSchema: z.ZodType<TurbineToolLocale, unknown>;
export declare function turbineToolLocaleFromJSON(jsonString: string): SafeParseResult<TurbineToolLocale, SDKValidationError>;
//# sourceMappingURL=turbinetoollocale.d.ts.map