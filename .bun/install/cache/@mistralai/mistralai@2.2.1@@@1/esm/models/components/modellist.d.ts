import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { BaseModelCard } from "./basemodelcard.js";
import { FTModelCard } from "./ftmodelcard.js";
export type ModelListData = BaseModelCard | FTModelCard | discriminatedUnionTypes.Unknown<"type">;
export type ModelList = {
    object: string;
    data?: Array<BaseModelCard | FTModelCard | discriminatedUnionTypes.Unknown<"type">> | undefined;
};
/** @internal */
export declare const ModelListData$inboundSchema: z.ZodType<ModelListData, unknown>;
export declare function modelListDataFromJSON(jsonString: string): SafeParseResult<ModelListData, SDKValidationError>;
/** @internal */
export declare const ModelList$inboundSchema: z.ZodType<ModelList, unknown>;
export declare function modelListFromJSON(jsonString: string): SafeParseResult<ModelList, SDKValidationError>;
//# sourceMappingURL=modellist.d.ts.map