import * as z from "zod/v4";
/**
 * Request model for creating a new voice with base64 audio.
 */
export type VoiceCreateRequest = {
    name: string;
    slug?: string | null | undefined;
    languages?: Array<string> | undefined;
    gender?: string | null | undefined;
    age?: number | null | undefined;
    tags?: Array<string> | null | undefined;
    color?: string | null | undefined;
    retentionNotice?: number | undefined;
    /**
     * Base64-encoded audio file
     */
    sampleAudio: string;
    /**
     * Original filename for extension detection
     */
    sampleFilename?: string | null | undefined;
};
/** @internal */
export type VoiceCreateRequest$Outbound = {
    name: string;
    slug?: string | null | undefined;
    languages?: Array<string> | undefined;
    gender?: string | null | undefined;
    age?: number | null | undefined;
    tags?: Array<string> | null | undefined;
    color?: string | null | undefined;
    retention_notice: number;
    sample_audio: string;
    sample_filename?: string | null | undefined;
};
/** @internal */
export declare const VoiceCreateRequest$outboundSchema: z.ZodType<VoiceCreateRequest$Outbound, VoiceCreateRequest>;
export declare function voiceCreateRequestToJSON(voiceCreateRequest: VoiceCreateRequest): string;
//# sourceMappingURL=voicecreaterequest.d.ts.map