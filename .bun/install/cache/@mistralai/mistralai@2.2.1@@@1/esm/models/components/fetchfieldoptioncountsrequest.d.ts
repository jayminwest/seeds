import * as z from "zod/v4";
import { FilterPayload, FilterPayload$Outbound } from "./filterpayload.js";
export type FetchFieldOptionCountsRequest = {
    filterParams?: FilterPayload | null | undefined;
};
/** @internal */
export type FetchFieldOptionCountsRequest$Outbound = {
    filter_params?: FilterPayload$Outbound | null | undefined;
};
/** @internal */
export declare const FetchFieldOptionCountsRequest$outboundSchema: z.ZodType<FetchFieldOptionCountsRequest$Outbound, FetchFieldOptionCountsRequest>;
export declare function fetchFieldOptionCountsRequestToJSON(fetchFieldOptionCountsRequest: FetchFieldOptionCountsRequest): string;
//# sourceMappingURL=fetchfieldoptioncountsrequest.d.ts.map