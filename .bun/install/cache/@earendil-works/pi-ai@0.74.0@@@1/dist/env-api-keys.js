// NEVER convert to top-level imports - breaks browser/Vite builds (web-ui)
let _existsSync = null;
let _homedir = null;
let _join = null;
const dynamicImport = (specifier) => import(specifier);
const NODE_FS_SPECIFIER = "node:" + "fs";
const NODE_OS_SPECIFIER = "node:" + "os";
const NODE_PATH_SPECIFIER = "node:" + "path";
// Eagerly load in Node.js/Bun environment only
if (typeof process !== "undefined" && (process.versions?.node || process.versions?.bun)) {
    dynamicImport(NODE_FS_SPECIFIER).then((m) => {
        _existsSync = m.existsSync;
    });
    dynamicImport(NODE_OS_SPECIFIER).then((m) => {
        _homedir = m.homedir;
    });
    dynamicImport(NODE_PATH_SPECIFIER).then((m) => {
        _join = m.join;
    });
}
let _procEnvCache = null;
/**
 * Fallback for https://github.com/oven-sh/bun/issues/27802
 * Bun compiled binaries have an empty `process.env` inside sandbox
 * environments on Linux. We can recover the env from `/proc/self/environ`.
 */
function getProcEnv(key) {
    if (!process.versions?.bun)
        return undefined;
    if (typeof process === "undefined")
        return undefined;
    // If process.env already has entries, the bug is not triggered.
    if (Object.keys(process.env).length > 0)
        return undefined;
    if (_procEnvCache === null) {
        _procEnvCache = new Map();
        try {
            const { readFileSync } = require("node:fs");
            const data = readFileSync("/proc/self/environ", "utf-8");
            for (const entry of data.split("\0")) {
                const idx = entry.indexOf("=");
                if (idx > 0) {
                    _procEnvCache.set(entry.slice(0, idx), entry.slice(idx + 1));
                }
            }
        }
        catch {
            // /proc/self/environ may not be readable.
        }
    }
    return _procEnvCache.get(key);
}
let cachedVertexAdcCredentialsExists = null;
function hasVertexAdcCredentials() {
    if (cachedVertexAdcCredentialsExists === null) {
        // If node modules haven't loaded yet (async import race at startup),
        // return false WITHOUT caching so the next call retries once they're ready.
        // Only cache false permanently in a browser environment where fs is never available.
        if (!_existsSync || !_homedir || !_join) {
            const isNode = typeof process !== "undefined" && (process.versions?.node || process.versions?.bun);
            if (!isNode) {
                // Definitively in a browser — safe to cache false permanently
                cachedVertexAdcCredentialsExists = false;
            }
            return false;
        }
        // Check GOOGLE_APPLICATION_CREDENTIALS env var first (standard way)
        const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || getProcEnv("GOOGLE_APPLICATION_CREDENTIALS");
        if (gacPath) {
            cachedVertexAdcCredentialsExists = _existsSync(gacPath);
        }
        else {
            // Fall back to default ADC path (lazy evaluation)
            cachedVertexAdcCredentialsExists = _existsSync(_join(_homedir(), ".config", "gcloud", "application_default_credentials.json"));
        }
    }
    return cachedVertexAdcCredentialsExists;
}
function getApiKeyEnvVars(provider) {
    if (provider === "github-copilot") {
        return ["COPILOT_GITHUB_TOKEN", "GH_TOKEN", "GITHUB_TOKEN"];
    }
    // ANTHROPIC_OAUTH_TOKEN takes precedence over ANTHROPIC_API_KEY
    if (provider === "anthropic") {
        return ["ANTHROPIC_OAUTH_TOKEN", "ANTHROPIC_API_KEY"];
    }
    const envMap = {
        openai: "OPENAI_API_KEY",
        "azure-openai-responses": "AZURE_OPENAI_API_KEY",
        deepseek: "DEEPSEEK_API_KEY",
        google: "GEMINI_API_KEY",
        "google-vertex": "GOOGLE_CLOUD_API_KEY",
        groq: "GROQ_API_KEY",
        cerebras: "CEREBRAS_API_KEY",
        xai: "XAI_API_KEY",
        openrouter: "OPENROUTER_API_KEY",
        "vercel-ai-gateway": "AI_GATEWAY_API_KEY",
        zai: "ZAI_API_KEY",
        mistral: "MISTRAL_API_KEY",
        minimax: "MINIMAX_API_KEY",
        "minimax-cn": "MINIMAX_CN_API_KEY",
        moonshotai: "MOONSHOT_API_KEY",
        "moonshotai-cn": "MOONSHOT_API_KEY",
        huggingface: "HF_TOKEN",
        fireworks: "FIREWORKS_API_KEY",
        opencode: "OPENCODE_API_KEY",
        "opencode-go": "OPENCODE_API_KEY",
        "kimi-coding": "KIMI_API_KEY",
        "cloudflare-workers-ai": "CLOUDFLARE_API_KEY",
        "cloudflare-ai-gateway": "CLOUDFLARE_API_KEY",
        xiaomi: "XIAOMI_API_KEY",
        "xiaomi-token-plan-cn": "XIAOMI_TOKEN_PLAN_CN_API_KEY",
        "xiaomi-token-plan-ams": "XIAOMI_TOKEN_PLAN_AMS_API_KEY",
        "xiaomi-token-plan-sgp": "XIAOMI_TOKEN_PLAN_SGP_API_KEY",
    };
    const envVar = envMap[provider];
    return envVar ? [envVar] : undefined;
}
export function findEnvKeys(provider) {
    const envVars = getApiKeyEnvVars(provider);
    if (!envVars)
        return undefined;
    const found = envVars.filter((envVar) => !!process.env[envVar] || !!getProcEnv(envVar));
    return found.length > 0 ? found : undefined;
}
export function getEnvApiKey(provider) {
    const envKeys = findEnvKeys(provider);
    if (envKeys?.[0]) {
        return process.env[envKeys[0]] || getProcEnv(envKeys[0]);
    }
    // Vertex AI supports either an explicit API key or Application Default Credentials.
    // Auth is configured via `gcloud auth application-default login`.
    if (provider === "google-vertex") {
        const hasCredentials = hasVertexAdcCredentials();
        const hasProject = !!(process.env.GOOGLE_CLOUD_PROJECT ||
            process.env.GCLOUD_PROJECT ||
            getProcEnv("GOOGLE_CLOUD_PROJECT") ||
            getProcEnv("GCLOUD_PROJECT"));
        const hasLocation = !!(process.env.GOOGLE_CLOUD_LOCATION || getProcEnv("GOOGLE_CLOUD_LOCATION"));
        if (hasCredentials && hasProject && hasLocation) {
            return "<authenticated>";
        }
    }
    if (provider === "amazon-bedrock") {
        // Amazon Bedrock supports multiple credential sources:
        // 1. AWS_PROFILE - named profile from ~/.aws/credentials
        // 2. AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY - standard IAM keys
        // 3. AWS_BEARER_TOKEN_BEDROCK - Bedrock bearer token
        // 4. AWS_CONTAINER_CREDENTIALS_RELATIVE_URI - ECS task roles
        // 5. AWS_CONTAINER_CREDENTIALS_FULL_URI - ECS task roles (full URI)
        // 6. AWS_WEB_IDENTITY_TOKEN_FILE - IRSA (IAM Roles for Service Accounts)
        if (process.env.AWS_PROFILE ||
            (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
            process.env.AWS_BEARER_TOKEN_BEDROCK ||
            process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
            process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI ||
            process.env.AWS_WEB_IDENTITY_TOKEN_FILE ||
            getProcEnv("AWS_PROFILE") ||
            (getProcEnv("AWS_ACCESS_KEY_ID") && getProcEnv("AWS_SECRET_ACCESS_KEY")) ||
            getProcEnv("AWS_BEARER_TOKEN_BEDROCK") ||
            getProcEnv("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI") ||
            getProcEnv("AWS_CONTAINER_CREDENTIALS_FULL_URI") ||
            getProcEnv("AWS_WEB_IDENTITY_TOKEN_FILE")) {
            return "<authenticated>";
        }
    }
    return undefined;
}
//# sourceMappingURL=env-api-keys.js.map