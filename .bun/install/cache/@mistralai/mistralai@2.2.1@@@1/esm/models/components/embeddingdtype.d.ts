import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const EmbeddingDtype: {
    readonly Float: "float";
    readonly Int8: "int8";
    readonly Uint8: "uint8";
    readonly Binary: "binary";
    readonly Ubinary: "ubinary";
};
export type EmbeddingDtype = ClosedEnum<typeof EmbeddingDtype>;
/** @internal */
export declare const EmbeddingDtype$outboundSchema: z.ZodEnum<typeof EmbeddingDtype>;
//# sourceMappingURL=embeddingdtype.d.ts.map