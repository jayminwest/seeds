import * as z from "zod/v4";
import { AssistantMessage, AssistantMessage$Outbound } from "./assistantmessage.js";
import { SystemMessage, SystemMessage$Outbound } from "./systemmessage.js";
import { ToolMessage, ToolMessage$Outbound } from "./toolmessage.js";
import { UserMessage, UserMessage$Outbound } from "./usermessage.js";
export type InstructRequestMessage = (AssistantMessage & {
    role: "assistant";
}) | SystemMessage | ToolMessage | UserMessage;
export type InstructRequest = {
    messages: Array<(AssistantMessage & {
        role: "assistant";
    }) | SystemMessage | ToolMessage | UserMessage>;
};
/** @internal */
export type InstructRequestMessage$Outbound = (AssistantMessage$Outbound & {
    role: "assistant";
}) | SystemMessage$Outbound | ToolMessage$Outbound | UserMessage$Outbound;
/** @internal */
export declare const InstructRequestMessage$outboundSchema: z.ZodType<InstructRequestMessage$Outbound, InstructRequestMessage>;
export declare function instructRequestMessageToJSON(instructRequestMessage: InstructRequestMessage): string;
/** @internal */
export type InstructRequest$Outbound = {
    messages: Array<(AssistantMessage$Outbound & {
        role: "assistant";
    }) | SystemMessage$Outbound | ToolMessage$Outbound | UserMessage$Outbound>;
};
/** @internal */
export declare const InstructRequest$outboundSchema: z.ZodType<InstructRequest$Outbound, InstructRequest>;
export declare function instructRequestToJSON(instructRequest: InstructRequest): string;
//# sourceMappingURL=instructrequest.d.ts.map