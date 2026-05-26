import * as z from "zod/v4";
/**
 * Request model for partially updating voice metadata.
 */
export type VoiceUpdateRequest = {
    name?: string | null | undefined;
    languages?: Array<string> | null | undefined;
    gender?: string | null | undefined;
    age?: number | null | undefined;
    tags?: Array<string> | null | undefined;
};
/** @internal */
export type VoiceUpdateRequest$Outbound = {
    name?: string | null | undefined;
    languages?: Array<string> | null | undefined;
    gender?: string | null | undefined;
    age?: number | null | undefined;
    tags?: Array<string> | null | undefined;
};
/** @internal */
export declare const VoiceUpdateRequest$outboundSchema: z.ZodType<VoiceUpdateRequest$Outbound, VoiceUpdateRequest>;
export declare function voiceUpdateRequestToJSON(voiceUpdateRequest: VoiceUpdateRequest): string;
//# sourceMappingURL=voiceupdaterequest.d.ts.map