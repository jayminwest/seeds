import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * This is populated by Harmattan, but some fields have a name
 *
 * @remarks
 * that we don't want to expose in the API.
 */
export type ModelCapabilities = {
    completionChat: boolean;
    functionCalling: boolean;
    reasoning: boolean;
    completionFim: boolean;
    fineTuning: boolean;
    vision: boolean;
    ocr: boolean;
    classification: boolean;
    moderation: boolean;
    audio: boolean;
    audioTranscription: boolean;
    audioTranscriptionRealtime: boolean;
    audioSpeech: boolean;
};
/** @internal */
export declare const ModelCapabilities$inboundSchema: z.ZodType<ModelCapabilities, unknown>;
export declare function modelCapabilitiesFromJSON(jsonString: string): SafeParseResult<ModelCapabilities, SDKValidationError>;
//# sourceMappingURL=modelcapabilities.d.ts.map