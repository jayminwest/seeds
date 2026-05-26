import { ClientSDK } from "../lib/sdks.js";
import { Speech } from "./speech.js";
import { Transcriptions } from "./transcriptions.js";
import { Voices } from "./voices.js";
export declare class Audio extends ClientSDK {
    private _speech?;
    get speech(): Speech;
    private _transcriptions?;
    get transcriptions(): Transcriptions;
    private _voices?;
    get voices(): Voices;
}
//# sourceMappingURL=audio.d.ts.map