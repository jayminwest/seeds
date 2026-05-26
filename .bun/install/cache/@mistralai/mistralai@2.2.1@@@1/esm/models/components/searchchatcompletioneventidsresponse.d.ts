import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type SearchChatCompletionEventIdsResponse = {
    completionEventIds: Array<string>;
};
/** @internal */
export declare const SearchChatCompletionEventIdsResponse$inboundSchema: z.ZodType<SearchChatCompletionEventIdsResponse, unknown>;
export declare function searchChatCompletionEventIdsResponseFromJSON(jsonString: string): SafeParseResult<SearchChatCompletionEventIdsResponse, SDKValidationError>;
//# sourceMappingURL=searchchatcompletioneventidsresponse.d.ts.map