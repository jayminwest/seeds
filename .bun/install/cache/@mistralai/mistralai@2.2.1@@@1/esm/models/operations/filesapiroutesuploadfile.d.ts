import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
import * as components from "../components/index.js";
export declare const FileVisibility: {
    readonly Workspace: "workspace";
    readonly User: "user";
};
export type FileVisibility = ClosedEnum<typeof FileVisibility>;
export type MultiPartBodyParams = {
    expiry?: number | null | undefined;
    visibility?: FileVisibility | undefined;
    purpose?: components.FilePurpose | undefined;
    /**
     * The File object (not file name) to be uploaded.
     *
     * @remarks
     *  To upload a file and specify a custom file name you should format your request as such:
     *  ```bash
     *  file=@path/to/your/file.jsonl;filename=custom_name.jsonl
     *  ```
     *  Otherwise, you can just keep the original file name:
     *  ```bash
     *  file=@path/to/your/file.jsonl
     *  ```
     */
    file: components.FileT | Blob;
};
/** @internal */
export declare const FileVisibility$outboundSchema: z.ZodEnum<typeof FileVisibility>;
/** @internal */
export type MultiPartBodyParams$Outbound = {
    expiry?: number | null | undefined;
    visibility: string;
    purpose?: string | undefined;
    file: components.FileT$Outbound | Blob;
};
/** @internal */
export declare const MultiPartBodyParams$outboundSchema: z.ZodType<MultiPartBodyParams$Outbound, MultiPartBodyParams>;
export declare function multiPartBodyParamsToJSON(multiPartBodyParams: MultiPartBodyParams): string;
//# sourceMappingURL=filesapiroutesuploadfile.d.ts.map