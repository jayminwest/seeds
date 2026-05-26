import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { BaseTaskStatus } from "./basetaskstatus.js";
export type FetchCampaignStatusResponse = {
    status: BaseTaskStatus;
};
/** @internal */
export declare const FetchCampaignStatusResponse$inboundSchema: z.ZodType<FetchCampaignStatusResponse, unknown>;
export declare function fetchCampaignStatusResponseFromJSON(jsonString: string): SafeParseResult<FetchCampaignStatusResponse, SDKValidationError>;
//# sourceMappingURL=fetchcampaignstatusresponse.d.ts.map