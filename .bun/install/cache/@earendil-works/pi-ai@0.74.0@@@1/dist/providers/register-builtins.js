import { clearApiProviders, registerApiProvider } from "../api-registry.js";
import { AssistantMessageEventStream } from "../utils/event-stream.js";
const importNodeOnlyProvider = (specifier) => import(specifier);
let anthropicProviderModulePromise;
let azureOpenAIResponsesProviderModulePromise;
let googleProviderModulePromise;
let googleVertexProviderModulePromise;
let mistralProviderModulePromise;
let openAICodexResponsesProviderModulePromise;
let openAICompletionsProviderModulePromise;
let openAIResponsesProviderModulePromise;
let bedrockProviderModuleOverride;
let bedrockProviderModulePromise;
export function setBedrockProviderModule(module) {
    bedrockProviderModuleOverride = {
        stream: module.streamBedrock,
        streamSimple: module.streamSimpleBedrock,
    };
}
function forwardStream(target, source) {
    (async () => {
        for await (const event of source) {
            target.push(event);
        }
        target.end();
    })();
}
function createLazyLoadErrorMessage(model, error) {
    return {
        role: "assistant",
        content: [],
        api: model.api,
        provider: model.provider,
        model: model.id,
        usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
        stopReason: "error",
        errorMessage: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
    };
}
function createLazyStream(loadModule) {
    return (model, context, options) => {
        const outer = new AssistantMessageEventStream();
        loadModule()
            .then((module) => {
            const inner = module.stream(model, context, options);
            forwardStream(outer, inner);
        })
            .catch((error) => {
            const message = createLazyLoadErrorMessage(model, error);
            outer.push({ type: "error", reason: "error", error: message });
            outer.end(message);
        });
        return outer;
    };
}
function createLazySimpleStream(loadModule) {
    return (model, context, options) => {
        const outer = new AssistantMessageEventStream();
        loadModule()
            .then((module) => {
            const inner = module.streamSimple(model, context, options);
            forwardStream(outer, inner);
        })
            .catch((error) => {
            const message = createLazyLoadErrorMessage(model, error);
            outer.push({ type: "error", reason: "error", error: message });
            outer.end(message);
        });
        return outer;
    };
}
function loadAnthropicProviderModule() {
    anthropicProviderModulePromise ||= import("./anthropic.js").then((module) => {
        const provider = module;
        return {
            stream: provider.streamAnthropic,
            streamSimple: provider.streamSimpleAnthropic,
        };
    });
    return anthropicProviderModulePromise;
}
function loadAzureOpenAIResponsesProviderModule() {
    azureOpenAIResponsesProviderModulePromise ||= import("./azure-openai-responses.js").then((module) => {
        const provider = module;
        return {
            stream: provider.streamAzureOpenAIResponses,
            streamSimple: provider.streamSimpleAzureOpenAIResponses,
        };
    });
    return azureOpenAIResponsesProviderModulePromise;
}
function loadGoogleProviderModule() {
    googleProviderModulePromise ||= import("./google.js").then((module) => {
        const provider = module;
        return {
            stream: provider.streamGoogle,
            streamSimple: provider.streamSimpleGoogle,
        };
    });
    return googleProviderModulePromise;
}
function loadGoogleVertexProviderModule() {
    googleVertexProviderModulePromise ||= import("./google-vertex.js").then((module) => {
        const provider = module;
        return {
            stream: provider.streamGoogleVertex,
            streamSimple: provider.streamSimpleGoogleVertex,
        };
    });
    return googleVertexProviderModulePromise;
}
function loadMistralProviderModule() {
    mistralProviderModulePromise ||= import("./mistral.js").then((module) => {
        const provider = module;
        return {
            stream: provider.streamMistral,
            streamSimple: provider.streamSimpleMistral,
        };
    });
    return mistralProviderModulePromise;
}
function loadOpenAICodexResponsesProviderModule() {
    openAICodexResponsesProviderModulePromise ||= import("./openai-codex-responses.js").then((module) => {
        const provider = module;
        return {
            stream: provider.streamOpenAICodexResponses,
            streamSimple: provider.streamSimpleOpenAICodexResponses,
        };
    });
    return openAICodexResponsesProviderModulePromise;
}
function loadOpenAICompletionsProviderModule() {
    openAICompletionsProviderModulePromise ||= import("./openai-completions.js").then((module) => {
        const provider = module;
        return {
            stream: provider.streamOpenAICompletions,
            streamSimple: provider.streamSimpleOpenAICompletions,
        };
    });
    return openAICompletionsProviderModulePromise;
}
function loadOpenAIResponsesProviderModule() {
    openAIResponsesProviderModulePromise ||= import("./openai-responses.js").then((module) => {
        const provider = module;
        return {
            stream: provider.streamOpenAIResponses,
            streamSimple: provider.streamSimpleOpenAIResponses,
        };
    });
    return openAIResponsesProviderModulePromise;
}
function loadBedrockProviderModule() {
    if (bedrockProviderModuleOverride) {
        return Promise.resolve(bedrockProviderModuleOverride);
    }
    bedrockProviderModulePromise ||= importNodeOnlyProvider("./amazon-bedrock.js").then((module) => {
        const provider = module;
        return {
            stream: provider.streamBedrock,
            streamSimple: provider.streamSimpleBedrock,
        };
    });
    return bedrockProviderModulePromise;
}
export const streamAnthropic = createLazyStream(loadAnthropicProviderModule);
export const streamSimpleAnthropic = createLazySimpleStream(loadAnthropicProviderModule);
export const streamAzureOpenAIResponses = createLazyStream(loadAzureOpenAIResponsesProviderModule);
export const streamSimpleAzureOpenAIResponses = createLazySimpleStream(loadAzureOpenAIResponsesProviderModule);
export const streamGoogle = createLazyStream(loadGoogleProviderModule);
export const streamSimpleGoogle = createLazySimpleStream(loadGoogleProviderModule);
export const streamGoogleVertex = createLazyStream(loadGoogleVertexProviderModule);
export const streamSimpleGoogleVertex = createLazySimpleStream(loadGoogleVertexProviderModule);
export const streamMistral = createLazyStream(loadMistralProviderModule);
export const streamSimpleMistral = createLazySimpleStream(loadMistralProviderModule);
export const streamOpenAICodexResponses = createLazyStream(loadOpenAICodexResponsesProviderModule);
export const streamSimpleOpenAICodexResponses = createLazySimpleStream(loadOpenAICodexResponsesProviderModule);
export const streamOpenAICompletions = createLazyStream(loadOpenAICompletionsProviderModule);
export const streamSimpleOpenAICompletions = createLazySimpleStream(loadOpenAICompletionsProviderModule);
export const streamOpenAIResponses = createLazyStream(loadOpenAIResponsesProviderModule);
export const streamSimpleOpenAIResponses = createLazySimpleStream(loadOpenAIResponsesProviderModule);
const streamBedrockLazy = createLazyStream(loadBedrockProviderModule);
const streamSimpleBedrockLazy = createLazySimpleStream(loadBedrockProviderModule);
export function registerBuiltInApiProviders() {
    registerApiProvider({
        api: "anthropic-messages",
        stream: streamAnthropic,
        streamSimple: streamSimpleAnthropic,
    });
    registerApiProvider({
        api: "openai-completions",
        stream: streamOpenAICompletions,
        streamSimple: streamSimpleOpenAICompletions,
    });
    registerApiProvider({
        api: "mistral-conversations",
        stream: streamMistral,
        streamSimple: streamSimpleMistral,
    });
    registerApiProvider({
        api: "openai-responses",
        stream: streamOpenAIResponses,
        streamSimple: streamSimpleOpenAIResponses,
    });
    registerApiProvider({
        api: "azure-openai-responses",
        stream: streamAzureOpenAIResponses,
        streamSimple: streamSimpleAzureOpenAIResponses,
    });
    registerApiProvider({
        api: "openai-codex-responses",
        stream: streamOpenAICodexResponses,
        streamSimple: streamSimpleOpenAICodexResponses,
    });
    registerApiProvider({
        api: "google-generative-ai",
        stream: streamGoogle,
        streamSimple: streamSimpleGoogle,
    });
    registerApiProvider({
        api: "google-vertex",
        stream: streamGoogleVertex,
        streamSimple: streamSimpleGoogleVertex,
    });
    registerApiProvider({
        api: "bedrock-converse-stream",
        stream: streamBedrockLazy,
        streamSimple: streamSimpleBedrockLazy,
    });
}
export function resetApiProviders() {
    clearApiProviders();
    registerBuiltInApiProviders();
}
registerBuiltInApiProviders();
//# sourceMappingURL=register-builtins.js.map