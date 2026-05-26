import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const EncodedPayloadOptions: {
    readonly Offloaded: "offloaded";
    readonly Encrypted: "encrypted";
    readonly EncryptedPartial: "encrypted-partial";
};
export type EncodedPayloadOptions = ClosedEnum<typeof EncodedPayloadOptions>;
/** @internal */
export declare const EncodedPayloadOptions$outboundSchema: z.ZodEnum<typeof EncodedPayloadOptions>;
//# sourceMappingURL=encodedpayloadoptions.d.ts.map