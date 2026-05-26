import * as z from "zod/v4";
import { AssistantMessage, AssistantMessage$Outbound } from "./assistantmessage.js";
import { CodeInterpreterTool, CodeInterpreterTool$Outbound } from "./codeinterpretertool.js";
import { CustomConnector, CustomConnector$Outbound } from "./customconnector.js";
import { DocumentLibraryTool, DocumentLibraryTool$Outbound } from "./documentlibrarytool.js";
import { GuardrailConfig, GuardrailConfig$Outbound } from "./guardrailconfig.js";
import { ImageGenerationTool, ImageGenerationTool$Outbound } from "./imagegenerationtool.js";
import { MistralPromptMode } from "./mistralpromptmode.js";
import { Prediction, Prediction$Outbound } from "./prediction.js";
import { ReasoningEffort } from "./reasoningeffort.js";
import { ResponseFormat, ResponseFormat$Outbound } from "./responseformat.js";
import { SystemMessage, SystemMessage$Outbound } from "./systemmessage.js";
import { Tool, Tool$Outbound } from "./tool.js";
import { ToolChoice, ToolChoice$Outbound } from "./toolchoice.js";
import { ToolChoiceEnum } from "./toolchoiceenum.js";
import { ToolMessage, ToolMessage$Outbound } from "./toolmessage.js";
import { UserMessage, UserMessage$Outbound } from "./usermessage.js";
import { WebSearchPremiumTool, WebSearchPremiumTool$Outbound } from "./websearchpremiumtool.js";
import { WebSearchTool, WebSearchTool$Outbound } from "./websearchtool.js";
/**
 * Stop generation if this token is detected. Or if one of these tokens is detected when providing an array
 */
export type ChatCompletionStreamRequestStop = string | Array<string>;
export type ChatCompletionStreamRequestMessage = (AssistantMessage & {
    role: "assistant";
}) | SystemMessage | ToolMessage | UserMessage;
export type ChatCompletionStreamRequestTool = Tool | WebSearchTool | WebSearchPremiumTool | CodeInterpreterTool | ImageGenerationTool | DocumentLibraryTool | CustomConnector;
/**
 * Controls which (if any) tool is called by the model. `none` means the model will not call any tool and instead generates a message. `auto` means the model can pick between generating a message or calling one or more tools. `any` or `required` means the model must call one or more tools. Specifying a particular tool via `{"type": "function", "function": {"name": "my_function"}}` forces the model to call that tool.
 */
export type ChatCompletionStreamRequestToolChoice = ToolChoice | ToolChoiceEnum;
export type ChatCompletionStreamRequest = {
    /**
     * ID of the model to use. You can use the [List Available Models](/api/#tag/models/operation/list_models_v1_models_get) API to see all of your available models, or see our [Model overview](/models) for model descriptions.
     */
    model: string;
    /**
     * What sampling temperature to use, we recommend between 0.0 and 0.7. Higher values like 0.7 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. We generally recommend altering this or `top_p` but not both. The default value varies depending on the model you are targeting. Call the `/models` endpoint to retrieve the appropriate value.
     */
    temperature?: number | null | undefined;
    /**
     * Nucleus sampling, where the model considers the results of the tokens with `top_p` probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered. We generally recommend altering this or `temperature` but not both.
     */
    topP?: number | null | undefined;
    /**
     * The maximum number of tokens to generate in the completion. The token count of your prompt plus `max_tokens` cannot exceed the model's context length.
     */
    maxTokens?: number | null | undefined;
    stream?: boolean | undefined;
    /**
     * Stop generation if this token is detected. Or if one of these tokens is detected when providing an array
     */
    stop?: string | Array<string> | null | undefined;
    /**
     * The seed to use for random sampling. If set, different calls will generate deterministic results.
     */
    randomSeed?: number | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    /**
     * The prompt(s) to generate completions for, encoded as a list of dict with role and content.
     */
    messages: Array<(AssistantMessage & {
        role: "assistant";
    }) | SystemMessage | ToolMessage | UserMessage>;
    /**
     * Specify the format that the model must output. By default it will use `{ "type": "text" }`. Setting to `{ "type": "json_object" }` enables JSON mode, which guarantees the message the model generates is in JSON. When using JSON mode you MUST also instruct the model to produce JSON yourself with a system or a user message. Setting to `{ "type": "json_schema" }` enables JSON schema mode, which guarantees the message the model generates is in JSON and follows the schema you provide.
     */
    responseFormat?: ResponseFormat | undefined;
    /**
     * A list of tools the model may call. Use this to provide a list of functions the model may generate JSON inputs for.
     */
    tools?: Array<Tool | WebSearchTool | WebSearchPremiumTool | CodeInterpreterTool | ImageGenerationTool | DocumentLibraryTool | CustomConnector> | null | undefined;
    /**
     * Controls which (if any) tool is called by the model. `none` means the model will not call any tool and instead generates a message. `auto` means the model can pick between generating a message or calling one or more tools. `any` or `required` means the model must call one or more tools. Specifying a particular tool via `{"type": "function", "function": {"name": "my_function"}}` forces the model to call that tool.
     */
    toolChoice?: ToolChoice | ToolChoiceEnum | undefined;
    /**
     * The `presence_penalty` determines how much the model penalizes the repetition of words or phrases. A higher presence penalty encourages the model to use a wider variety of words and phrases, making the output more diverse and creative.
     */
    presencePenalty?: number | null | undefined;
    /**
     * The `frequency_penalty` penalizes the repetition of words based on their frequency in the generated text. A higher frequency penalty discourages the model from repeating words that have already appeared frequently in the output, promoting diversity and reducing repetition.
     */
    frequencyPenalty?: number | null | undefined;
    /**
     * Number of completions to return for each request, input tokens are only billed once.
     */
    n?: number | null | undefined;
    /**
     * Enable users to specify an expected completion, optimizing response times by leveraging known or predictable content.
     */
    prediction?: Prediction | undefined;
    /**
     * Whether to enable parallel function calling during tool use, when enabled the model can call multiple tools in parallel.
     */
    parallelToolCalls?: boolean | undefined;
    reasoningEffort?: ReasoningEffort | null | undefined;
    /**
     * Allows toggling between the reasoning mode and no system prompt. When set to `reasoning` the system prompt for reasoning models will be used.
     */
    promptMode?: MistralPromptMode | null | undefined;
    guardrails?: Array<GuardrailConfig> | null | undefined;
    /**
     * Whether to inject a safety prompt before all conversations.
     */
    safePrompt?: boolean | undefined;
};
/** @internal */
export type ChatCompletionStreamRequestStop$Outbound = string | Array<string>;
/** @internal */
export declare const ChatCompletionStreamRequestStop$outboundSchema: z.ZodType<ChatCompletionStreamRequestStop$Outbound, ChatCompletionStreamRequestStop>;
export declare function chatCompletionStreamRequestStopToJSON(chatCompletionStreamRequestStop: ChatCompletionStreamRequestStop): string;
/** @internal */
export type ChatCompletionStreamRequestMessage$Outbound = (AssistantMessage$Outbound & {
    role: "assistant";
}) | SystemMessage$Outbound | ToolMessage$Outbound | UserMessage$Outbound;
/** @internal */
export declare const ChatCompletionStreamRequestMessage$outboundSchema: z.ZodType<ChatCompletionStreamRequestMessage$Outbound, ChatCompletionStreamRequestMessage>;
export declare function chatCompletionStreamRequestMessageToJSON(chatCompletionStreamRequestMessage: ChatCompletionStreamRequestMessage): string;
/** @internal */
export type ChatCompletionStreamRequestTool$Outbound = Tool$Outbound | WebSearchTool$Outbound | WebSearchPremiumTool$Outbound | CodeInterpreterTool$Outbound | ImageGenerationTool$Outbound | DocumentLibraryTool$Outbound | CustomConnector$Outbound;
/** @internal */
export declare const ChatCompletionStreamRequestTool$outboundSchema: z.ZodType<ChatCompletionStreamRequestTool$Outbound, ChatCompletionStreamRequestTool>;
export declare function chatCompletionStreamRequestToolToJSON(chatCompletionStreamRequestTool: ChatCompletionStreamRequestTool): string;
/** @internal */
export type ChatCompletionStreamRequestToolChoice$Outbound = ToolChoice$Outbound | string;
/** @internal */
export declare const ChatCompletionStreamRequestToolChoice$outboundSchema: z.ZodType<ChatCompletionStreamRequestToolChoice$Outbound, ChatCompletionStreamRequestToolChoice>;
export declare function chatCompletionStreamRequestToolChoiceToJSON(chatCompletionStreamRequestToolChoice: ChatCompletionStreamRequestToolChoice): string;
/** @internal */
export type ChatCompletionStreamRequest$Outbound = {
    model: string;
    temperature?: number | null | undefined;
    top_p?: number | null | undefined;
    max_tokens?: number | null | undefined;
    stream: boolean;
    stop?: string | Array<string> | null | undefined;
    random_seed?: number | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    messages: Array<(AssistantMessage$Outbound & {
        role: "assistant";
    }) | SystemMessage$Outbound | ToolMessage$Outbound | UserMessage$Outbound>;
    response_format?: ResponseFormat$Outbound | undefined;
    tools?: Array<Tool$Outbound | WebSearchTool$Outbound | WebSearchPremiumTool$Outbound | CodeInterpreterTool$Outbound | ImageGenerationTool$Outbound | DocumentLibraryTool$Outbound | CustomConnector$Outbound> | null | undefined;
    tool_choice?: ToolChoice$Outbound | string | undefined;
    presence_penalty?: number | null | undefined;
    frequency_penalty?: number | null | undefined;
    n?: number | null | undefined;
    prediction?: Prediction$Outbound | undefined;
    parallel_tool_calls?: boolean | undefined;
    reasoning_effort?: string | null | undefined;
    prompt_mode?: string | null | undefined;
    guardrails?: Array<GuardrailConfig$Outbound> | null | undefined;
    safe_prompt?: boolean | undefined;
};
/** @internal */
export declare const ChatCompletionStreamRequest$outboundSchema: z.ZodType<ChatCompletionStreamRequest$Outbound, ChatCompletionStreamRequest>;
export declare function chatCompletionStreamRequestToJSON(chatCompletionStreamRequest: ChatCompletionStreamRequest): string;
//# sourceMappingURL=chatcompletionstreamrequest.d.ts.map