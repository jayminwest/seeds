import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Campaign } from "./campaign.js";
export type PaginatedResultCampaignPreview = {
    results?: Array<Campaign> | undefined;
    count: number;
    next?: string | null | undefined;
    previous?: string | null | undefined;
};
/** @internal */
export declare const PaginatedResultCampaignPreview$inboundSchema: z.ZodType<PaginatedResultCampaignPreview, unknown>;
export declare function paginatedResultCampaignPreviewFromJSON(jsonString: string): SafeParseResult<PaginatedResultCampaignPreview, SDKValidationError>;
//# sourceMappingURL=paginatedresultcampaignpreview.d.ts.map