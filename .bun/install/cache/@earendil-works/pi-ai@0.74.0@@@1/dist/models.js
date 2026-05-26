import { MODELS } from "./models.generated.js";
const modelRegistry = new Map();
// Initialize registry from MODELS on module load
for (const [provider, models] of Object.entries(MODELS)) {
    const providerModels = new Map();
    for (const [id, model] of Object.entries(models)) {
        providerModels.set(id, model);
    }
    modelRegistry.set(provider, providerModels);
}
export function getModel(provider, modelId) {
    const providerModels = modelRegistry.get(provider);
    return providerModels?.get(modelId);
}
export function getProviders() {
    return Array.from(modelRegistry.keys());
}
export function getModels(provider) {
    const models = modelRegistry.get(provider);
    return models ? Array.from(models.values()) : [];
}
export function calculateCost(model, usage) {
    usage.cost.input = (model.cost.input / 1000000) * usage.input;
    usage.cost.output = (model.cost.output / 1000000) * usage.output;
    usage.cost.cacheRead = (model.cost.cacheRead / 1000000) * usage.cacheRead;
    usage.cost.cacheWrite = (model.cost.cacheWrite / 1000000) * usage.cacheWrite;
    usage.cost.total = usage.cost.input + usage.cost.output + usage.cost.cacheRead + usage.cost.cacheWrite;
    return usage.cost;
}
const EXTENDED_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"];
export function getSupportedThinkingLevels(model) {
    if (!model.reasoning)
        return ["off"];
    return EXTENDED_THINKING_LEVELS.filter((level) => {
        const mapped = model.thinkingLevelMap?.[level];
        if (mapped === null)
            return false;
        if (level === "xhigh")
            return mapped !== undefined;
        return true;
    });
}
export function clampThinkingLevel(model, level) {
    const availableLevels = getSupportedThinkingLevels(model);
    if (availableLevels.includes(level))
        return level;
    const requestedIndex = EXTENDED_THINKING_LEVELS.indexOf(level);
    if (requestedIndex === -1)
        return availableLevels[0] ?? "off";
    for (let i = requestedIndex; i < EXTENDED_THINKING_LEVELS.length; i++) {
        const candidate = EXTENDED_THINKING_LEVELS[i];
        if (availableLevels.includes(candidate))
            return candidate;
    }
    for (let i = requestedIndex - 1; i >= 0; i--) {
        const candidate = EXTENDED_THINKING_LEVELS[i];
        if (availableLevels.includes(candidate))
            return candidate;
    }
    return availableLevels[0] ?? "off";
}
/**
 * Check if two models are equal by comparing both their id and provider.
 * Returns false if either model is null or undefined.
 */
export function modelsAreEqual(a, b) {
    if (!a || !b)
        return false;
    return a.id === b.id && a.provider === b.provider;
}
//# sourceMappingURL=models.js.map