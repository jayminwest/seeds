import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
/**
 * The type of entity, used to share a library.
 */
export declare const EntityType: {
    readonly User: "User";
    readonly Workspace: "Workspace";
    readonly Org: "Org";
};
/**
 * The type of entity, used to share a library.
 */
export type EntityType = OpenEnum<typeof EntityType>;
/** @internal */
export declare const EntityType$outboundSchema: z.ZodType<string, EntityType>;
//# sourceMappingURL=entitytype.d.ts.map