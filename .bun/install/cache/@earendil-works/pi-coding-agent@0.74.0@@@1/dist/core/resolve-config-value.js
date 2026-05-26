/**
 * Resolve configuration values that may be shell commands, environment variables, or literals.
 * Used by auth-storage.ts and model-registry.ts.
 */
import { execSync, spawnSync } from "child_process";
import { getShellConfig } from "../utils/shell.js";
// Cache for shell command results (persists for process lifetime)
const commandResultCache = new Map();
/**
 * Resolve a config value (API key, header value, etc.) to an actual value.
 * - If starts with "!", executes the rest as a shell command and uses stdout (cached)
 * - Otherwise checks environment variable first, then treats as literal (not cached)
 */
export function resolveConfigValue(config) {
    if (config.startsWith("!")) {
        return executeCommand(config);
    }
    const envValue = process.env[config];
    return envValue || config;
}
function executeWithConfiguredShell(command) {
    try {
        const { shell, args } = getShellConfig();
        const result = spawnSync(shell, [...args, command], {
            encoding: "utf-8",
            timeout: 10000,
            stdio: ["ignore", "pipe", "ignore"],
            shell: false,
            windowsHide: true,
        });
        if (result.error) {
            const error = result.error;
            if (error.code === "ENOENT") {
                return { executed: false, value: undefined };
            }
            return { executed: true, value: undefined };
        }
        if (result.status !== 0) {
            return { executed: true, value: undefined };
        }
        const value = (result.stdout ?? "").trim();
        return { executed: true, value: value || undefined };
    }
    catch {
        return { executed: false, value: undefined };
    }
}
function executeWithDefaultShell(command) {
    try {
        const output = execSync(command, {
            encoding: "utf-8",
            timeout: 10000,
            stdio: ["ignore", "pipe", "ignore"],
        });
        return output.trim() || undefined;
    }
    catch {
        return undefined;
    }
}
function executeCommandUncached(commandConfig) {
    const command = commandConfig.slice(1);
    return process.platform === "win32"
        ? (() => {
            const configuredResult = executeWithConfiguredShell(command);
            return configuredResult.executed ? configuredResult.value : executeWithDefaultShell(command);
        })()
        : executeWithDefaultShell(command);
}
function executeCommand(commandConfig) {
    if (commandResultCache.has(commandConfig)) {
        return commandResultCache.get(commandConfig);
    }
    const result = executeCommandUncached(commandConfig);
    commandResultCache.set(commandConfig, result);
    return result;
}
/**
 * Resolve all header values using the same resolution logic as API keys.
 */
export function resolveConfigValueUncached(config) {
    if (config.startsWith("!")) {
        return executeCommandUncached(config);
    }
    const envValue = process.env[config];
    return envValue || config;
}
export function resolveConfigValueOrThrow(config, description) {
    const resolvedValue = resolveConfigValueUncached(config);
    if (resolvedValue !== undefined) {
        return resolvedValue;
    }
    if (config.startsWith("!")) {
        throw new Error(`Failed to resolve ${description} from shell command: ${config.slice(1)}`);
    }
    throw new Error(`Failed to resolve ${description}`);
}
/**
 * Resolve all header values using the same resolution logic as API keys.
 */
export function resolveHeaders(headers) {
    if (!headers)
        return undefined;
    const resolved = {};
    for (const [key, value] of Object.entries(headers)) {
        const resolvedValue = resolveConfigValue(value);
        if (resolvedValue) {
            resolved[key] = resolvedValue;
        }
    }
    return Object.keys(resolved).length > 0 ? resolved : undefined;
}
export function resolveHeadersOrThrow(headers, description) {
    if (!headers)
        return undefined;
    const resolved = {};
    for (const [key, value] of Object.entries(headers)) {
        resolved[key] = resolveConfigValueOrThrow(value, `${description} header "${key}"`);
    }
    return Object.keys(resolved).length > 0 ? resolved : undefined;
}
/** Clear the config value command cache. Exported for testing. */
export function clearConfigValueCache() {
    commandResultCache.clear();
}
//# sourceMappingURL=resolve-config-value.js.map