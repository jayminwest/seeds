import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { PaginatedResultCampaignPreview } from "./paginatedresultcampaignpreview.js";
export type ListCampaignsResponse = {
    campaigns: PaginatedResultCampaignPreview;
};
/** @internal */
export declare const ListCampaignsResponse$inboundSchema: z.ZodType<ListCampaignsResponse, unknown>;
export declare function listCampaignsResponseFromJSON(jsonString: string): SafeParseResult<ListCampaignsResponse, SDKValidationError>;
//# sourceMappingURL=listcampaignsresponse.d.ts.map