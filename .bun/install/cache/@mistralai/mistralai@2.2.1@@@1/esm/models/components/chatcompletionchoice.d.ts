import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { AssistantMessage } from "./assistantmessage.js";
import { DeltaMessage } from "./deltamessage.js";
export declare const ChatCompletionChoiceFinishReason: {
    readonly Stop: "stop";
    readonly Length: "length";
    readonly ModelLength: "model_length";
    readonly Error: "error";
    readonly ToolCalls: "tool_calls";
};
export type ChatCompletionChoiceFinishReason = OpenEnum<typeof ChatCompletionChoiceFinishReason>;
export type ChatCompletionChoice = {
    index: number;
    message?: AssistantMessage | undefined;
    messages?: Array<DeltaMessage> | undefined;
    finishReason: ChatCompletionChoiceFinishReason;
};
/** @internal */
export declare const ChatCompletionChoiceFinishReason$inboundSchema: z.ZodType<ChatCompletionChoiceFinishReason, unknown>;
/** @internal */
export declare const ChatCompletionChoice$inboundSchema: z.ZodType<ChatCompletionChoice, unknown>;
export declare function chatCompletionChoiceFromJSON(jsonString: string): SafeParseResult<ChatCompletionChoice, SDKValidationError>;
//# sourceMappingURL=chatcompletionchoice.d.ts.map