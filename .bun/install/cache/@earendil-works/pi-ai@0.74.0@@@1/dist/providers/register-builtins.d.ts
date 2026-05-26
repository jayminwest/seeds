import type { AssistantMessageEvent, Context, Model, SimpleStreamOptions, StreamFunction } from "../types.js";
import type { BedrockOptions } from "./amazon-bedrock.js";
import type { AnthropicOptions } from "./anthropic.js";
import type { AzureOpenAIResponsesOptions } from "./azure-openai-responses.js";
import type { GoogleOptions } from "./google.js";
import type { GoogleVertexOptions } from "./google-vertex.js";
import type { MistralOptions } from "./mistral.js";
import type { OpenAICodexResponsesOptions } from "./openai-codex-responses.js";
import type { OpenAICompletionsOptions } from "./openai-completions.js";
import type { OpenAIResponsesOptions } from "./openai-responses.js";
interface BedrockProviderModule {
    streamBedrock: (model: Model<"bedrock-converse-stream">, context: Context, options?: BedrockOptions) => AsyncIterable<AssistantMessageEvent>;
    streamSimpleBedrock: (model: Model<"bedrock-converse-stream">, context: Context, options?: SimpleStreamOptions) => AsyncIterable<AssistantMessageEvent>;
}
export declare function setBedrockProviderModule(module: BedrockProviderModule): void;
export declare const streamAnthropic: StreamFunction<"anthropic-messages", AnthropicOptions>;
export declare const streamSimpleAnthropic: StreamFunction<"anthropic-messages", SimpleStreamOptions>;
export declare const streamAzureOpenAIResponses: StreamFunction<"azure-openai-responses", AzureOpenAIResponsesOptions>;
export declare const streamSimpleAzureOpenAIResponses: StreamFunction<"azure-openai-responses", SimpleStreamOptions>;
export declare const streamGoogle: StreamFunction<"google-generative-ai", GoogleOptions>;
export declare const streamSimpleGoogle: StreamFunction<"google-generative-ai", SimpleStreamOptions>;
export declare const streamGoogleVertex: StreamFunction<"google-vertex", GoogleVertexOptions>;
export declare const streamSimpleGoogleVertex: StreamFunction<"google-vertex", SimpleStreamOptions>;
export declare const streamMistral: StreamFunction<"mistral-conversations", MistralOptions>;
export declare const streamSimpleMistral: StreamFunction<"mistral-conversations", SimpleStreamOptions>;
export declare const streamOpenAICodexResponses: StreamFunction<"openai-codex-responses", OpenAICodexResponsesOptions>;
export declare const streamSimpleOpenAICodexResponses: StreamFunction<"openai-codex-responses", SimpleStreamOptions>;
export declare const streamOpenAICompletions: StreamFunction<"openai-completions", OpenAICompletionsOptions>;
export declare const streamSimpleOpenAICompletions: StreamFunction<"openai-completions", SimpleStreamOptions>;
export declare const streamOpenAIResponses: StreamFunction<"openai-responses", OpenAIResponsesOptions>;
export declare const streamSimpleOpenAIResponses: StreamFunction<"openai-responses", SimpleStreamOptions>;
export declare function registerBuiltInApiProviders(): void;
export declare function resetApiProviders(): void;
export {};
//# sourceMappingURL=register-builtins.d.ts.map