import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type EmbeddingResponseData = {
    object?: string | undefined;
    embedding?: Array<number> | undefined;
    index?: number | undefined;
};
/** @internal */
export declare const EmbeddingResponseData$inboundSchema: z.ZodType<EmbeddingResponseData, unknown>;
export declare function embeddingResponseDataFromJSON(jsonString: string): SafeParseResult<EmbeddingResponseData, SDKValidationError>;
//# sourceMappingURL=embeddingresponsedata.d.ts.map