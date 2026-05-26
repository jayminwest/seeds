import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const EncodingFormat: {
    readonly Float: "float";
    readonly Base64: "base64";
};
export type EncodingFormat = ClosedEnum<typeof EncodingFormat>;
/** @internal */
export declare const EncodingFormat$outboundSchema: z.ZodEnum<typeof EncodingFormat>;
//# sourceMappingURL=encodingformat.d.ts.map