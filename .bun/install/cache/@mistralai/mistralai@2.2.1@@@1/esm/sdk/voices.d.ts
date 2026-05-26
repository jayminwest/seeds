import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Voices extends ClientSDK {
    /**
     * List all voices
     *
     * @remarks
     * List all voices (excluding sample data)
     */
    list(request?: operations.ListVoicesV1AudioVoicesGetRequest | undefined, options?: RequestOptions): Promise<components.VoiceListResponse>;
    /**
     * Create a new voice
     *
     * @remarks
     * Create a new voice with a base64-encoded audio sample
     */
    create(request: components.VoiceCreateRequest, options?: RequestOptions): Promise<components.VoiceResponse>;
    /**
     * Delete a custom voice
     *
     * @remarks
     * Delete a custom voice
     */
    delete(request: operations.DeleteVoiceV1AudioVoicesVoiceIdDeleteRequest, options?: RequestOptions): Promise<components.VoiceResponse>;
    /**
     * Update voice metadata
     *
     * @remarks
     * Update voice metadata (name, gender, languages, age, tags).
     */
    update(request: operations.UpdateVoiceV1AudioVoicesVoiceIdPatchRequest, options?: RequestOptions): Promise<components.VoiceResponse>;
    /**
     * Get voice details
     *
     * @remarks
     * Get voice details (excluding sample)
     */
    get(request: operations.GetVoiceV1AudioVoicesVoiceIdGetRequest, options?: RequestOptions): Promise<components.VoiceResponse>;
    /**
     * Get voice sample audio
     *
     * @remarks
     * Get the audio sample for a voice
     */
    getSampleAudio(request: operations.GetVoiceSampleAudioV1AudioVoicesVoiceIdSampleGetRequest, options?: RequestOptions): Promise<ReadableStream<Uint8Array>>;
}
//# sourceMappingURL=voices.d.ts.map