import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Fields extends ClientSDK {
    /**
     * Get Chat Completion Fields
     */
    list(options?: RequestOptions): Promise<components.ListChatCompletionFieldsResponse>;
    /**
     * Get Chat Completion Field Options
     */
    fetchOptions(request: operations.GetChatCompletionFieldOptionsV1ObservabilityChatCompletionFieldsFieldNameOptionsGetRequest, options?: RequestOptions): Promise<components.FetchChatCompletionFieldOptionsResponse>;
    /**
     * Get Chat Completion Field Options Counts
     */
    fetchOptionCounts(request: operations.GetChatCompletionFieldOptionsCountsV1ObservabilityChatCompletionFieldsFieldNameOptionsCountsPostRequest, options?: RequestOptions): Promise<components.FetchFieldOptionCountsResponse>;
}
//# sourceMappingURL=fields.d.ts.map