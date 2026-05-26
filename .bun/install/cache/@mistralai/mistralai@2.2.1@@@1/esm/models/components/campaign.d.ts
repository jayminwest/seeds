import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { FilterPayload } from "./filterpayload.js";
import { Judge } from "./judge.js";
export type Campaign = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    name: string;
    ownerId: string;
    workspaceId: string;
    description: string;
    maxNbEvents: number;
    searchParams: FilterPayload;
    judge: Judge;
};
/** @internal */
export declare const Campaign$inboundSchema: z.ZodType<Campaign, unknown>;
export declare function campaignFromJSON(jsonString: string): SafeParseResult<Campaign, SDKValidationError>;
//# sourceMappingURL=campaign.d.ts.map