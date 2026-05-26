import * as z from "zod/v4";
import { SpeechOutputFormat } from "./speechoutputformat.js";
export type SpeechRequest = {
    model?: string | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    stream?: boolean | undefined;
    /**
     * The preset or custom voice to use for generating the speech.
     */
    voiceId?: string | null | undefined;
    /**
     * The audio reference for generating the speech.
     */
    refAudio?: string | null | undefined;
    /**
     * Text to generate a speech from
     */
    input: string;
    responseFormat?: SpeechOutputFormat | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export type SpeechRequest$Outbound = {
    model?: string | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    stream: boolean;
    voice_id?: string | null | undefined;
    ref_audio?: string | null | undefined;
    input: string;
    response_format?: string | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const SpeechRequest$outboundSchema: z.ZodType<SpeechRequest$Outbound, SpeechRequest>;
export declare function speechRequestToJSON(speechRequest: SpeechRequest): string;
//# sourceMappingURL=speechrequest.d.ts.map