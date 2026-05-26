import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type SpeechStreamAudioDelta = {
    type: "speech.audio.delta";
    audioData: string;
};
/** @internal */
export declare const SpeechStreamAudioDelta$inboundSchema: z.ZodType<SpeechStreamAudioDelta, unknown>;
export declare function speechStreamAudioDeltaFromJSON(jsonString: string): SafeParseResult<SpeechStreamAudioDelta, SDKValidationError>;
//# sourceMappingURL=speechstreamaudiodelta.d.ts.map