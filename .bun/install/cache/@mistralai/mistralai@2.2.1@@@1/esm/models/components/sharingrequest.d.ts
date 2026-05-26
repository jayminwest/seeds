import * as z from "zod/v4";
import { EntityType } from "./entitytype.js";
import { ShareEnum } from "./shareenum.js";
export type SharingRequest = {
    orgId?: string | null | undefined;
    level: ShareEnum;
    /**
     * The id of the entity (user, workspace or organization) to share with
     */
    shareWithUuid: string;
    /**
     * The type of entity, used to share a library.
     */
    shareWithType: EntityType;
};
/** @internal */
export type SharingRequest$Outbound = {
    org_id?: string | null | undefined;
    level: string;
    share_with_uuid: string;
    share_with_type: string;
};
/** @internal */
export declare const SharingRequest$outboundSchema: z.ZodType<SharingRequest$Outbound, SharingRequest>;
export declare function sharingRequestToJSON(sharingRequest: SharingRequest): string;
//# sourceMappingURL=sharingrequest.d.ts.map