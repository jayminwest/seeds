import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { Model } from "@earendil-works/pi-ai";
import { AuthStorage } from "./auth-storage.js";
import type { SessionStartEvent, ToolDefinition } from "./extensions/index.js";
import { ModelRegistry } from "./model-registry.js";
import { type DefaultResourceLoaderOptions, type ResourceLoader } from "./resource-loader.js";
import { type CreateAgentSessionOptions, type CreateAgentSessionResult } from "./sdk.js";
import type { SessionManager } from "./session-manager.js";
import { SettingsManager } from "./settings-manager.js";
/**
 * Non-fatal issues collected while creating services or sessions.
 *
 * Runtime creation returns diagnostics to the caller instead of printing or
 * exiting. The app layer decides whether warnings should be shown and whether
 * errors should abort startup.
 */
export interface AgentSessionRuntimeDiagnostic {
    type: "info" | "warning" | "error";
    message: string;
}
/**
 * Inputs for creating cwd-bound runtime services.
 *
 * These services are recreated whenever the effective session cwd changes.
 * CLI-provided resource paths should be resolved to absolute paths before they
 * reach this function, so later cwd switches do not reinterpret them.
 */
export interface CreateAgentSessionServicesOptions {
    cwd: string;
    agentDir?: string;
    authStorage?: AuthStorage;
    settingsManager?: SettingsManager;
    modelRegistry?: ModelRegistry;
    extensionFlagValues?: Map<string, boolean | string>;
    resourceLoaderOptions?: Omit<DefaultResourceLoaderOptions, "cwd" | "agentDir" | "settingsManager">;
}
/**
 * Inputs for creating an AgentSession from already-created services.
 *
 * Use this after services exist and any cwd-bound model/tool/session options
 * have been resolved against those services.
 */
export interface CreateAgentSessionFromServicesOptions {
    services: AgentSessionServices;
    sessionManager: SessionManager;
    sessionStartEvent?: SessionStartEvent;
    model?: Model<any>;
    thinkingLevel?: ThinkingLevel;
    scopedModels?: Array<{
        model: Model<any>;
        thinkingLevel?: ThinkingLevel;
    }>;
    tools?: string[];
    noTools?: CreateAgentSessionOptions["noTools"];
    customTools?: ToolDefinition[];
}
/**
 * Coherent cwd-bound runtime services for one effective session cwd.
 *
 * This is infrastructure only. The AgentSession itself is created separately so
 * session options can be resolved against these services first.
 */
export interface AgentSessionServices {
    cwd: string;
    agentDir: string;
    authStorage: AuthStorage;
    settingsManager: SettingsManager;
    modelRegistry: ModelRegistry;
    resourceLoader: ResourceLoader;
    diagnostics: AgentSessionRuntimeDiagnostic[];
}
/**
 * Create cwd-bound runtime services.
 *
 * Returns services plus diagnostics. It does not create an AgentSession.
 */
export declare function createAgentSessionServices(options: CreateAgentSessionServicesOptions): Promise<AgentSessionServices>;
/**
 * Create an AgentSession from previously created services.
 *
 * This keeps session creation separate from service creation so callers can
 * resolve model, thinking, tools, and other session inputs against the target
 * cwd before constructing the session.
 */
export declare function createAgentSessionFromServices(options: CreateAgentSessionFromServicesOptions): Promise<CreateAgentSessionResult>;
//# sourceMappingURL=agent-session-services.d.ts.map