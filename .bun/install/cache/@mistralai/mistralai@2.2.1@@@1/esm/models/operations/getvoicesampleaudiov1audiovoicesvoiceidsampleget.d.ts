import * as z from "zod/v4";
export type GetVoiceSampleAudioV1AudioVoicesVoiceIdSampleGetRequest = {
    voiceId: string;
};
/** @internal */
export type GetVoiceSampleAudioV1AudioVoicesVoiceIdSampleGetRequest$Outbound = {
    voice_id: string;
};
/** @internal */
export declare const GetVoiceSampleAudioV1AudioVoicesVoiceIdSampleGetRequest$outboundSchema: z.ZodType<GetVoiceSampleAudioV1AudioVoicesVoiceIdSampleGetRequest$Outbound, GetVoiceSampleAudioV1AudioVoicesVoiceIdSampleGetRequest>;
export declare function getVoiceSampleAudioV1AudioVoicesVoiceIdSampleGetRequestToJSON(getVoiceSampleAudioV1AudioVoicesVoiceIdSampleGetRequest: GetVoiceSampleAudioV1AudioVoicesVoiceIdSampleGetRequest): string;
//# sourceMappingURL=getvoicesampleaudiov1audiovoicesvoiceidsampleget.d.ts.map