import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const FileVisibility: {
    readonly Workspace: "workspace";
    readonly User: "user";
};
export type FileVisibility = OpenEnum<typeof FileVisibility>;
/** @internal */
export declare const FileVisibility$inboundSchema: z.ZodType<FileVisibility, unknown>;
//# sourceMappingURL=filevisibility.d.ts.map