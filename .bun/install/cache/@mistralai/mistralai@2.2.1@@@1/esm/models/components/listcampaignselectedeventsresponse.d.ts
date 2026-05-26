import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PaginatedResultChatCompletionEventPreview } from "./paginatedresultchatcompletioneventpreview.js";
export type ListCampaignSelectedEventsResponse = {
    completionEvents: PaginatedResultChatCompletionEventPreview;
};
/** @internal */
export declare const ListCampaignSelectedEventsResponse$inboundSchema: z.ZodType<ListCampaignSelectedEventsResponse, unknown>;
export declare function listCampaignSelectedEventsResponseFromJSON(jsonString: string): SafeParseResult<ListCampaignSelectedEventsResponse, SDKValidationError>;
//# sourceMappingURL=listcampaignselectedeventsresponse.d.ts.map