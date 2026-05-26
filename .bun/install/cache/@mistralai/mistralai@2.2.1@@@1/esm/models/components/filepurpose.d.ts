import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const FilePurpose: {
    readonly FineTune: "fine-tune";
    readonly Batch: "batch";
    readonly Ocr: "ocr";
};
export type FilePurpose = OpenEnum<typeof FilePurpose>;
/** @internal */
export declare const FilePurpose$inboundSchema: z.ZodType<FilePurpose, unknown>;
/** @internal */
export declare const FilePurpose$outboundSchema: z.ZodType<string, FilePurpose>;
//# sourceMappingURL=filepurpose.d.ts.map