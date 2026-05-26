import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const ResourceVisibility: {
    readonly SharedGlobal: "shared_global";
    readonly SharedOrg: "shared_org";
    readonly SharedWorkspace: "shared_workspace";
    readonly Private: "private";
};
export type ResourceVisibility = OpenEnum<typeof ResourceVisibility>;
/** @internal */
export declare const ResourceVisibility$inboundSchema: z.ZodType<ResourceVisibility, unknown>;
/** @internal */
export declare const ResourceVisibility$outboundSchema: z.ZodType<string, ResourceVisibility>;
//# sourceMappingURL=resourcevisibility.d.ts.map