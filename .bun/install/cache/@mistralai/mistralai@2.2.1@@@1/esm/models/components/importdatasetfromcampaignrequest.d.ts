import * as z from "zod/v4";
export type ImportDatasetFromCampaignRequest = {
    campaignId: string;
};
/** @internal */
export type ImportDatasetFromCampaignRequest$Outbound = {
    campaign_id: string;
};
/** @internal */
export declare const ImportDatasetFromCampaignRequest$outboundSchema: z.ZodType<ImportDatasetFromCampaignRequest$Outbound, ImportDatasetFromCampaignRequest>;
export declare function importDatasetFromCampaignRequestToJSON(importDatasetFromCampaignRequest: ImportDatasetFromCampaignRequest): string;
//# sourceMappingURL=importdatasetfromcampaignrequest.d.ts.map