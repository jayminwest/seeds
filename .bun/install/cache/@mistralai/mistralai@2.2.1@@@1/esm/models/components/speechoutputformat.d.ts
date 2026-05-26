import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const SpeechOutputFormat: {
    readonly Pcm: "pcm";
    readonly Wav: "wav";
    readonly Mp3: "mp3";
    readonly Flac: "flac";
    readonly Opus: "opus";
};
export type SpeechOutputFormat = ClosedEnum<typeof SpeechOutputFormat>;
/** @internal */
export declare const SpeechOutputFormat$outboundSchema: z.ZodEnum<typeof SpeechOutputFormat>;
//# sourceMappingURL=speechoutputformat.d.ts.map