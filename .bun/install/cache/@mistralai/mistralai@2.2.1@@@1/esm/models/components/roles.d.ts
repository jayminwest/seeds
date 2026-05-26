import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const Roles: {
    readonly System: "system";
    readonly User: "user";
    readonly Assistant: "assistant";
    readonly Tool: "tool";
};
export type Roles = OpenEnum<typeof Roles>;
/** @internal */
export declare const Roles$inboundSchema: z.ZodType<Roles, unknown>;
//# sourceMappingURL=roles.d.ts.map