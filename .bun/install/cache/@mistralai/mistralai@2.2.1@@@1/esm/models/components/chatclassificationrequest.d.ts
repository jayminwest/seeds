import * as z from "zod/v4";
import { Inputs, Inputs$Outbound } from "./inputs.js";
export type ChatClassificationRequest = {
    model: string;
    /**
     * Chat to classify
     */
    input: Inputs;
};
/** @internal */
export type ChatClassificationRequest$Outbound = {
    model: string;
    input: Inputs$Outbound;
};
/** @internal */
export declare const ChatClassificationRequest$outboundSchema: z.ZodType<ChatClassificationRequest$Outbound, ChatClassificationRequest>;
export declare function chatClassificationRequestToJSON(chatClassificationRequest: ChatClassificationRequest): string;
//# sourceMappingURL=chatclassificationrequest.d.ts.map