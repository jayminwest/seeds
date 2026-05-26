import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ToolType } from "./tooltype.js";
import { TurbineToolLocale } from "./turbinetoollocale.js";
export type TurbineToolMeta = {
    locale?: TurbineToolLocale | null | undefined;
    toolType?: ToolType | null | undefined;
    timeout?: number | null | undefined;
    privateExecution?: boolean | null | undefined;
};
/** @internal */
export declare const TurbineToolMeta$inboundSchema: z.ZodType<TurbineToolMeta, unknown>;
export declare function turbineToolMetaFromJSON(jsonString: string): SafeParseResult<TurbineToolMeta, SDKValidationError>;
//# sourceMappingURL=turbinetoolmeta.d.ts.map