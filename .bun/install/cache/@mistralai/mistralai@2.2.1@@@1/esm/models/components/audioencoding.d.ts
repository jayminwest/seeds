import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const AudioEncoding: {
    readonly PcmS16le: "pcm_s16le";
    readonly PcmS32le: "pcm_s32le";
    readonly PcmF16le: "pcm_f16le";
    readonly PcmF32le: "pcm_f32le";
    readonly PcmMulaw: "pcm_mulaw";
    readonly PcmAlaw: "pcm_alaw";
};
export type AudioEncoding = OpenEnum<typeof AudioEncoding>;
/** @internal */
export declare const AudioEncoding$inboundSchema: z.ZodType<AudioEncoding, unknown>;
/** @internal */
export declare const AudioEncoding$outboundSchema: z.ZodType<string, AudioEncoding>;
//# sourceMappingURL=audioencoding.d.ts.map