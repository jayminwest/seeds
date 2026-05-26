import * as z from "zod/v4";
export type GetVoiceV1AudioVoicesVoiceIdGetRequest = {
    voiceId: string;
};
/** @internal */
export type GetVoiceV1AudioVoicesVoiceIdGetRequest$Outbound = {
    voice_id: string;
};
/** @internal */
export declare const GetVoiceV1AudioVoicesVoiceIdGetRequest$outboundSchema: z.ZodType<GetVoiceV1AudioVoicesVoiceIdGetRequest$Outbound, GetVoiceV1AudioVoicesVoiceIdGetRequest>;
export declare function getVoiceV1AudioVoicesVoiceIdGetRequestToJSON(getVoiceV1AudioVoicesVoiceIdGetRequest: GetVoiceV1AudioVoicesVoiceIdGetRequest): string;
//# sourceMappingURL=getvoicev1audiovoicesvoiceidget.d.ts.map