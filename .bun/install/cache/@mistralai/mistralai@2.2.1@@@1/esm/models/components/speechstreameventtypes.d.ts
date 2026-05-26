import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const SpeechStreamEventTypes: {
    readonly SpeechAudioDelta: "speech.audio.delta";
    readonly SpeechAudioDone: "speech.audio.done";
};
export type SpeechStreamEventTypes = OpenEnum<typeof SpeechStreamEventTypes>;
/** @internal */
export declare const SpeechStreamEventTypes$inboundSchema: z.ZodType<SpeechStreamEventTypes, unknown>;
//# sourceMappingURL=speechstreameventtypes.d.ts.map