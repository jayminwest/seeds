import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const ShareEnum: {
    readonly Viewer: "Viewer";
    readonly Editor: "Editor";
};
export type ShareEnum = OpenEnum<typeof ShareEnum>;
/** @internal */
export declare const ShareEnum$outboundSchema: z.ZodType<string, ShareEnum>;
//# sourceMappingURL=shareenum.d.ts.map