import * as z from "zod/v4";
import { AssistantMessage, AssistantMessage$Outbound } from "./assistantmessage.js";
import { SystemMessage, SystemMessage$Outbound } from "./systemmessage.js";
import { ToolMessage, ToolMessage$Outbound } from "./toolmessage.js";
import { UserMessage, UserMessage$Outbound } from "./usermessage.js";
export type ChatModerationRequestInputs2 = (AssistantMessage & {
    role: "assistant";
}) | SystemMessage | ToolMessage | UserMessage;
export type ChatModerationRequestInputs1 = (AssistantMessage & {
    role: "assistant";
}) | SystemMessage | ToolMessage | UserMessage;
/**
 * Chat to classify
 */
export type ChatModerationRequestInputs3 = Array<(AssistantMessage & {
    role: "assistant";
}) | SystemMessage | ToolMessage | UserMessage> | Array<Array<(AssistantMessage & {
    role: "assistant";
}) | SystemMessage | ToolMessage | UserMessage>>;
export type ChatModerationRequest = {
    /**
     * Chat to classify
     */
    inputs: Array<(AssistantMessage & {
        role: "assistant";
    }) | SystemMessage | ToolMessage | UserMessage> | Array<Array<(AssistantMessage & {
        role: "assistant";
    }) | SystemMessage | ToolMessage | UserMessage>>;
    model: string;
};
/** @internal */
export type ChatModerationRequestInputs2$Outbound = (AssistantMessage$Outbound & {
    role: "assistant";
}) | SystemMessage$Outbound | ToolMessage$Outbound | UserMessage$Outbound;
/** @internal */
export declare const ChatModerationRequestInputs2$outboundSchema: z.ZodType<ChatModerationRequestInputs2$Outbound, ChatModerationRequestInputs2>;
export declare function chatModerationRequestInputs2ToJSON(chatModerationRequestInputs2: ChatModerationRequestInputs2): string;
/** @internal */
export type ChatModerationRequestInputs1$Outbound = (AssistantMessage$Outbound & {
    role: "assistant";
}) | SystemMessage$Outbound | ToolMessage$Outbound | UserMessage$Outbound;
/** @internal */
export declare const ChatModerationRequestInputs1$outboundSchema: z.ZodType<ChatModerationRequestInputs1$Outbound, ChatModerationRequestInputs1>;
export declare function chatModerationRequestInputs1ToJSON(chatModerationRequestInputs1: ChatModerationRequestInputs1): string;
/** @internal */
export type ChatModerationRequestInputs3$Outbound = Array<(AssistantMessage$Outbound & {
    role: "assistant";
}) | SystemMessage$Outbound | ToolMessage$Outbound | UserMessage$Outbound> | Array<Array<(AssistantMessage$Outbound & {
    role: "assistant";
}) | SystemMessage$Outbound | ToolMessage$Outbound | UserMessage$Outbound>>;
/** @internal */
export declare const ChatModerationRequestInputs3$outboundSchema: z.ZodType<ChatModerationRequestInputs3$Outbound, ChatModerationRequestInputs3>;
export declare function chatModerationRequestInputs3ToJSON(chatModerationRequestInputs3: ChatModerationRequestInputs3): string;
/** @internal */
export type ChatModerationRequest$Outbound = {
    input: Array<(AssistantMessage$Outbound & {
        role: "assistant";
    }) | SystemMessage$Outbound | ToolMessage$Outbound | UserMessage$Outbound> | Array<Array<(AssistantMessage$Outbound & {
        role: "assistant";
    }) | SystemMessage$Outbound | ToolMessage$Outbound | UserMessage$Outbound>>;
    model: string;
};
/** @internal */
export declare const ChatModerationRequest$outboundSchema: z.ZodType<ChatModerationRequest$Outbound, ChatModerationRequest>;
export declare function chatModerationRequestToJSON(chatModerationRequest: ChatModerationRequest): string;
//# sourceMappingURL=chatmoderationrequest.d.ts.map