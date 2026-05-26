import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type Option = string | boolean;
export type FetchChatCompletionFieldOptionsResponse = {
    options?: Array<string | boolean | null> | null | undefined;
};
/** @internal */
export declare const Option$inboundSchema: z.ZodType<Option, unknown>;
export declare function optionFromJSON(jsonString: string): SafeParseResult<Option, SDKValidationError>;
/** @internal */
export declare const FetchChatCompletionFieldOptionsResponse$inboundSchema: z.ZodType<FetchChatCompletionFieldOptionsResponse, unknown>;
export declare function fetchChatCompletionFieldOptionsResponseFromJSON(jsonString: string): SafeParseResult<FetchChatCompletionFieldOptionsResponse, SDKValidationError>;
//# sourceMappingURL=fetchchatcompletionfieldoptionsresponse.d.ts.map