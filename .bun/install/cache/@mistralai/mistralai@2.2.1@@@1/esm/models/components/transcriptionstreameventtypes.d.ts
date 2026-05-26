import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const TranscriptionStreamEventTypes: {
    readonly TranscriptionLanguage: "transcription.language";
    readonly TranscriptionSegment: "transcription.segment";
    readonly TranscriptionTextDelta: "transcription.text.delta";
    readonly TranscriptionDone: "transcription.done";
};
export type TranscriptionStreamEventTypes = OpenEnum<typeof TranscriptionStreamEventTypes>;
/** @internal */
export declare const TranscriptionStreamEventTypes$inboundSchema: z.ZodType<TranscriptionStreamEventTypes, unknown>;
//# sourceMappingURL=transcriptionstreameventtypes.d.ts.map