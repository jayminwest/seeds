import * as z from "zod/v4";
export type DeleteVoiceV1AudioVoicesVoiceIdDeleteRequest = {
    voiceId: string;
};
/** @internal */
export type DeleteVoiceV1AudioVoicesVoiceIdDeleteRequest$Outbound = {
    voice_id: string;
};
/** @internal */
export declare const DeleteVoiceV1AudioVoicesVoiceIdDeleteRequest$outboundSchema: z.ZodType<DeleteVoiceV1AudioVoicesVoiceIdDeleteRequest$Outbound, DeleteVoiceV1AudioVoicesVoiceIdDeleteRequest>;
export declare function deleteVoiceV1AudioVoicesVoiceIdDeleteRequestToJSON(deleteVoiceV1AudioVoicesVoiceIdDeleteRequest: DeleteVoiceV1AudioVoicesVoiceIdDeleteRequest): string;
//# sourceMappingURL=deletevoicev1audiovoicesvoiceiddelete.d.ts.map