import { CompleteAcceptEnum } from "../funcs/audioSpeechComplete.js";
import { EventStream } from "../lib/event-streams.js";
import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export { CompleteAcceptEnum } from "../funcs/audioSpeechComplete.js";
export declare class Speech extends ClientSDK {
    /**
     * Speech
     */
    complete(request: components.SpeechRequest & {
        stream?: false | undefined;
    }, options?: RequestOptions & {
        acceptHeaderOverride?: CompleteAcceptEnum;
    }): Promise<operations.SpeechResponse>;
    complete(request: components.SpeechRequest & {
        stream: true;
    }, options?: RequestOptions & {
        acceptHeaderOverride?: CompleteAcceptEnum;
    }): Promise<EventStream<operations.SpeechStreamEvents>>;
    complete(request: components.SpeechRequest, options?: RequestOptions & {
        acceptHeaderOverride?: CompleteAcceptEnum;
    }): Promise<operations.SpeechV1AudioSpeechPostResponse>;
}
//# sourceMappingURL=speech.d.ts.map