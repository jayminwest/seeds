import * as z from "zod/v4";
export type JudgeConversationRequest = {
    messages: Array<{
        [k: string]: any;
    }>;
    properties?: {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export type JudgeConversationRequest$Outbound = {
    messages: Array<{
        [k: string]: any;
    }>;
    properties?: {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export declare const JudgeConversationRequest$outboundSchema: z.ZodType<JudgeConversationRequest$Outbound, JudgeConversationRequest>;
export declare function judgeConversationRequestToJSON(judgeConversationRequest: JudgeConversationRequest): string;
//# sourceMappingURL=judgeconversationrequest.d.ts.map