import * as z from "zod/v4";
import { FilterPayload, FilterPayload$Outbound } from "./filterpayload.js";
export type CreateCampaignRequest = {
    searchParams: FilterPayload;
    judgeId: string;
    name: string;
    description: string;
    maxNbEvents: number;
};
/** @internal */
export type CreateCampaignRequest$Outbound = {
    search_params: FilterPayload$Outbound;
    judge_id: string;
    name: string;
    description: string;
    max_nb_events: number;
};
/** @internal */
export declare const CreateCampaignRequest$outboundSchema: z.ZodType<CreateCampaignRequest$Outbound, CreateCampaignRequest>;
export declare function createCampaignRequestToJSON(createCampaignRequest: CreateCampaignRequest): string;
//# sourceMappingURL=createcampaignrequest.d.ts.map