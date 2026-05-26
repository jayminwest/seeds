import * as z from "zod/v4";
import * as components from "../components/index.js";
export type UpdateVoiceV1AudioVoicesVoiceIdPatchRequest = {
    voiceId: string;
    voiceUpdateRequest: components.VoiceUpdateRequest;
};
/** @internal */
export type UpdateVoiceV1AudioVoicesVoiceIdPatchRequest$Outbound = {
    voice_id: string;
    VoiceUpdateRequest: components.VoiceUpdateRequest$Outbound;
};
/** @internal */
export declare const UpdateVoiceV1AudioVoicesVoiceIdPatchRequest$outboundSchema: z.ZodType<UpdateVoiceV1AudioVoicesVoiceIdPatchRequest$Outbound, UpdateVoiceV1AudioVoicesVoiceIdPatchRequest>;
export declare function updateVoiceV1AudioVoicesVoiceIdPatchRequestToJSON(updateVoiceV1AudioVoicesVoiceIdPatchRequest: UpdateVoiceV1AudioVoicesVoiceIdPatchRequest): string;
//# sourceMappingURL=updatevoicev1audiovoicesvoiceidpatch.d.ts.map