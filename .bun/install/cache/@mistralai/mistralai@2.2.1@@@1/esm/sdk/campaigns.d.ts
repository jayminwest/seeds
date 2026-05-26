import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Campaigns extends ClientSDK {
    /**
     * Create and start a new campaign
     */
    create(request: components.CreateCampaignRequest, options?: RequestOptions): Promise<components.Campaign>;
    /**
     * Get all campaigns
     */
    list(request?: operations.GetCampaignsV1ObservabilityCampaignsGetRequest | undefined, options?: RequestOptions): Promise<components.ListCampaignsResponse>;
    /**
     * Get campaign by id
     */
    fetch(request: operations.GetCampaignByIdV1ObservabilityCampaignsCampaignIdGetRequest, options?: RequestOptions): Promise<components.Campaign>;
    /**
     * Delete a campaign
     */
    delete(request: operations.DeleteCampaignV1ObservabilityCampaignsCampaignIdDeleteRequest, options?: RequestOptions): Promise<void>;
    /**
     * Get campaign status by campaign id
     */
    fetchStatus(request: operations.GetCampaignStatusByIdV1ObservabilityCampaignsCampaignIdStatusGetRequest, options?: RequestOptions): Promise<components.FetchCampaignStatusResponse>;
    /**
     * Get event ids that were selected by the given campaign
     */
    listEvents(request: operations.GetCampaignSelectedEventsV1ObservabilityCampaignsCampaignIdSelectedEventsGetRequest, options?: RequestOptions): Promise<components.ListCampaignSelectedEventsResponse>;
}
//# sourceMappingURL=campaigns.d.ts.map