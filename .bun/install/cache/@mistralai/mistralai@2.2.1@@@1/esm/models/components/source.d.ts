import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const Source: {
    readonly Upload: "upload";
    readonly Repository: "repository";
    readonly Mistral: "mistral";
};
export type Source = OpenEnum<typeof Source>;
/** @internal */
export declare const Source$inboundSchema: z.ZodType<Source, unknown>;
/** @internal */
export declare const Source$outboundSchema: z.ZodType<string, Source>;
//# sourceMappingURL=source.d.ts.map