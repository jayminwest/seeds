import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const ResponseFormats: {
    readonly Text: "text";
    readonly JsonObject: "json_object";
    readonly JsonSchema: "json_schema";
};
export type ResponseFormats = OpenEnum<typeof ResponseFormats>;
/** @internal */
export declare const ResponseFormats$inboundSchema: z.ZodType<ResponseFormats, unknown>;
/** @internal */
export declare const ResponseFormats$outboundSchema: z.ZodType<string, ResponseFormats>;
//# sourceMappingURL=responseformats.d.ts.map