import { MODELS } from "./models.generated.js";
import type { Api, KnownProvider, Model, ModelThinkingLevel, Usage } from "./types.js";
type ModelApi<TProvider extends KnownProvider, TModelId extends keyof (typeof MODELS)[TProvider]> = (typeof MODELS)[TProvider][TModelId] extends {
    api: infer TApi;
} ? (TApi extends Api ? TApi : never) : never;
export declare function getModel<TProvider extends KnownProvider, TModelId extends keyof (typeof MODELS)[TProvider]>(provider: TProvider, modelId: TModelId): Model<ModelApi<TProvider, TModelId>>;
export declare function getProviders(): KnownProvider[];
export declare function getModels<TProvider extends KnownProvider>(provider: TProvider): Model<ModelApi<TProvider, keyof (typeof MODELS)[TProvider]>>[];
export declare function calculateCost<TApi extends Api>(model: Model<TApi>, usage: Usage): Usage["cost"];
export declare function getSupportedThinkingLevels<TApi extends Api>(model: Model<TApi>): ModelThinkingLevel[];
export declare function clampThinkingLevel<TApi extends Api>(model: Model<TApi>, level: ModelThinkingLevel): ModelThinkingLevel;
/**
 * Check if two models are equal by comparing both their id and provider.
 * Returns false if either model is null or undefined.
 */
export declare function modelsAreEqual<TApi extends Api>(a: Model<TApi> | null | undefined, b: Model<TApi> | null | undefined): boolean;
export {};
//# sourceMappingURL=models.d.ts.map