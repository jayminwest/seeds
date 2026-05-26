import { join } from "node:path";
import { Agent } from "@earendil-works/pi-agent-core";
import { clampThinkingLevel, streamSimple } from "@earendil-works/pi-ai";
import { getAgentDir } from "../config.js";
import { AgentSession } from "./agent-session.js";
import { formatNoModelsAvailableMessage } from "./auth-guidance.js";
import { AuthStorage } from "./auth-storage.js";
import { DEFAULT_THINKING_LEVEL } from "./defaults.js";
import { convertToLlm } from "./messages.js";
import { ModelRegistry } from "./model-registry.js";
import { findInitialModel } from "./model-resolver.js";
import { DefaultResourceLoader } from "./resource-loader.js";
import { getDefaultSessionDir, SessionManager } from "./session-manager.js";
import { SettingsManager } from "./settings-manager.js";
import { isInstallTelemetryEnabled } from "./telemetry.js";
import { time } from "./timings.js";
import { createBashTool, createCodingTools, createEditTool, createFindTool, createGrepTool, createLsTool, createReadOnlyTools, createReadTool, createWriteTool, withFileMutationQueue, } from "./tools/index.js";
// Re-exports
export * from "./agent-session-runtime.js";
export { withFileMutationQueue, 
// Tool factories (for custom cwd)
createCodingTools, createReadOnlyTools, createReadTool, createBashTool, createEditTool, createWriteTool, createGrepTool, createFindTool, createLsTool, };
// Helper Functions
function getDefaultAgentDir() {
    return getAgentDir();
}
function getAttributionHeaders(model, settingsManager) {
    if (!isInstallTelemetryEnabled(settingsManager)) {
        return undefined;
    }
    if (model.provider === "openrouter" || model.baseUrl.includes("openrouter.ai")) {
        return {
            "HTTP-Referer": "https://pi.dev",
            "X-OpenRouter-Title": "pi",
            "X-OpenRouter-Categories": "cli-agent",
        };
    }
    if (model.provider === "cloudflare-workers-ai" ||
        model.provider === "cloudflare-ai-gateway" ||
        model.baseUrl.includes("api.cloudflare.com") ||
        model.baseUrl.includes("gateway.ai.cloudflare.com")) {
        return {
            "User-Agent": "pi-coding-agent",
        };
    }
    return undefined;
}
/**
 * Create an AgentSession with the specified options.
 *
 * @example
 * ```typescript
 * // Minimal - uses defaults
 * const { session } = await createAgentSession();
 *
 * // With explicit model
 * import { getModel } from '@earendil-works/pi-ai';
 * const { session } = await createAgentSession({
 *   model: getModel('anthropic', 'claude-opus-4-5'),
 *   thinkingLevel: 'high',
 * });
 *
 * // Continue previous session
 * const { session, modelFallbackMessage } = await createAgentSession({
 *   continueSession: true,
 * });
 *
 * // Full control
 * const loader = new DefaultResourceLoader({
 *   cwd: process.cwd(),
 *   agentDir: getAgentDir(),
 *   settingsManager: SettingsManager.create(),
 * });
 * await loader.reload();
 * const { session } = await createAgentSession({
 *   model: myModel,
 *   tools: [readTool, bashTool],
 *   resourceLoader: loader,
 *   sessionManager: SessionManager.inMemory(),
 * });
 * ```
 */
export async function createAgentSession(options = {}) {
    const cwd = options.cwd ?? options.sessionManager?.getCwd() ?? process.cwd();
    const agentDir = options.agentDir ?? getDefaultAgentDir();
    let resourceLoader = options.resourceLoader;
    // Use provided or create AuthStorage and ModelRegistry
    const authPath = options.agentDir ? join(agentDir, "auth.json") : undefined;
    const modelsPath = options.agentDir ? join(agentDir, "models.json") : undefined;
    const authStorage = options.authStorage ?? AuthStorage.create(authPath);
    const modelRegistry = options.modelRegistry ?? ModelRegistry.create(authStorage, modelsPath);
    const settingsManager = options.settingsManager ?? SettingsManager.create(cwd, agentDir);
    const sessionManager = options.sessionManager ?? SessionManager.create(cwd, getDefaultSessionDir(cwd, agentDir));
    if (!resourceLoader) {
        resourceLoader = new DefaultResourceLoader({ cwd, agentDir, settingsManager });
        await resourceLoader.reload();
        time("resourceLoader.reload");
    }
    // Check if session has existing data to restore
    const existingSession = sessionManager.buildSessionContext();
    const hasExistingSession = existingSession.messages.length > 0;
    const hasThinkingEntry = sessionManager.getBranch().some((entry) => entry.type === "thinking_level_change");
    let model = options.model;
    let modelFallbackMessage;
    // If session has data, try to restore model from it
    if (!model && hasExistingSession && existingSession.model) {
        const restoredModel = modelRegistry.find(existingSession.model.provider, existingSession.model.modelId);
        if (restoredModel && modelRegistry.hasConfiguredAuth(restoredModel)) {
            model = restoredModel;
        }
        if (!model) {
            modelFallbackMessage = `Could not restore model ${existingSession.model.provider}/${existingSession.model.modelId}`;
        }
    }
    // If still no model, use findInitialModel (checks settings default, then provider defaults)
    if (!model) {
        const result = await findInitialModel({
            scopedModels: [],
            isContinuing: hasExistingSession,
            defaultProvider: settingsManager.getDefaultProvider(),
            defaultModelId: settingsManager.getDefaultModel(),
            defaultThinkingLevel: settingsManager.getDefaultThinkingLevel(),
            modelRegistry,
        });
        model = result.model;
        if (!model) {
            modelFallbackMessage = formatNoModelsAvailableMessage();
        }
        else if (modelFallbackMessage) {
            modelFallbackMessage += `. Using ${model.provider}/${model.id}`;
        }
    }
    let thinkingLevel = options.thinkingLevel;
    // If session has data, restore thinking level from it
    if (thinkingLevel === undefined && hasExistingSession) {
        thinkingLevel = hasThinkingEntry
            ? existingSession.thinkingLevel
            : (settingsManager.getDefaultThinkingLevel() ?? DEFAULT_THINKING_LEVEL);
    }
    // Fall back to settings default
    if (thinkingLevel === undefined) {
        thinkingLevel = settingsManager.getDefaultThinkingLevel() ?? DEFAULT_THINKING_LEVEL;
    }
    // Clamp to model capabilities
    if (!model) {
        thinkingLevel = "off";
    }
    else {
        thinkingLevel = clampThinkingLevel(model, thinkingLevel);
    }
    const defaultActiveToolNames = ["read", "bash", "edit", "write"];
    const allowedToolNames = options.tools ?? (options.noTools === "all" ? [] : undefined);
    const initialActiveToolNames = options.tools
        ? [...options.tools]
        : options.noTools
            ? []
            : defaultActiveToolNames;
    let agent;
    // Create convertToLlm wrapper that filters images if blockImages is enabled (defense-in-depth)
    const convertToLlmWithBlockImages = (messages) => {
        const converted = convertToLlm(messages);
        // Check setting dynamically so mid-session changes take effect
        if (!settingsManager.getBlockImages()) {
            return converted;
        }
        // Filter out ImageContent from all messages, replacing with text placeholder
        return converted.map((msg) => {
            if (msg.role === "user" || msg.role === "toolResult") {
                const content = msg.content;
                if (Array.isArray(content)) {
                    const hasImages = content.some((c) => c.type === "image");
                    if (hasImages) {
                        const filteredContent = content
                            .map((c) => c.type === "image" ? { type: "text", text: "Image reading is disabled." } : c)
                            .filter((c, i, arr) => 
                        // Dedupe consecutive "Image reading is disabled." texts
                        !(c.type === "text" &&
                            c.text === "Image reading is disabled." &&
                            i > 0 &&
                            arr[i - 1].type === "text" &&
                            arr[i - 1].text === "Image reading is disabled."));
                        return { ...msg, content: filteredContent };
                    }
                }
            }
            return msg;
        });
    };
    const extensionRunnerRef = {};
    agent = new Agent({
        initialState: {
            systemPrompt: "",
            model,
            thinkingLevel,
            tools: [],
        },
        convertToLlm: convertToLlmWithBlockImages,
        streamFn: async (model, context, options) => {
            const auth = await modelRegistry.getApiKeyAndHeaders(model);
            if (!auth.ok) {
                throw new Error(auth.error);
            }
            const providerRetrySettings = settingsManager.getProviderRetrySettings();
            const attributionHeaders = getAttributionHeaders(model, settingsManager);
            return streamSimple(model, context, {
                ...options,
                apiKey: auth.apiKey,
                timeoutMs: options?.timeoutMs ?? providerRetrySettings.timeoutMs,
                maxRetries: options?.maxRetries ?? providerRetrySettings.maxRetries,
                maxRetryDelayMs: options?.maxRetryDelayMs ?? providerRetrySettings.maxRetryDelayMs,
                headers: attributionHeaders || auth.headers || options?.headers
                    ? { ...attributionHeaders, ...auth.headers, ...options?.headers }
                    : undefined,
            });
        },
        onPayload: async (payload, _model) => {
            const runner = extensionRunnerRef.current;
            if (!runner?.hasHandlers("before_provider_request")) {
                return payload;
            }
            return runner.emitBeforeProviderRequest(payload);
        },
        onResponse: async (response, _model) => {
            const runner = extensionRunnerRef.current;
            if (!runner?.hasHandlers("after_provider_response")) {
                return;
            }
            await runner.emit({
                type: "after_provider_response",
                status: response.status,
                headers: response.headers,
            });
        },
        sessionId: sessionManager.getSessionId(),
        transformContext: async (messages) => {
            const runner = extensionRunnerRef.current;
            if (!runner)
                return messages;
            return runner.emitContext(messages);
        },
        steeringMode: settingsManager.getSteeringMode(),
        followUpMode: settingsManager.getFollowUpMode(),
        transport: settingsManager.getTransport(),
        thinkingBudgets: settingsManager.getThinkingBudgets(),
        maxRetryDelayMs: settingsManager.getProviderRetrySettings().maxRetryDelayMs,
    });
    // Restore messages if session has existing data
    if (hasExistingSession) {
        agent.state.messages = existingSession.messages;
        if (!hasThinkingEntry) {
            sessionManager.appendThinkingLevelChange(thinkingLevel);
        }
    }
    else {
        // Save initial model and thinking level for new sessions so they can be restored on resume
        if (model) {
            sessionManager.appendModelChange(model.provider, model.id);
        }
        sessionManager.appendThinkingLevelChange(thinkingLevel);
    }
    const session = new AgentSession({
        agent,
        sessionManager,
        settingsManager,
        cwd,
        scopedModels: options.scopedModels,
        resourceLoader,
        customTools: options.customTools,
        modelRegistry,
        initialActiveToolNames,
        allowedToolNames,
        extensionRunnerRef,
        sessionStartEvent: options.sessionStartEvent,
    });
    const extensionsResult = resourceLoader.getExtensions();
    return {
        session,
        extensionsResult,
        modelFallbackMessage,
    };
}
//# sourceMappingURL=sdk.js.map