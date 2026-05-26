import type { SimpleStreamOptions, StreamFunction, StreamOptions } from "../types.js";
import type { GoogleThinkingLevel } from "./google-shared.js";
export interface GoogleOptions extends StreamOptions {
    toolChoice?: "auto" | "none" | "any";
    thinking?: {
        enabled: boolean;
        budgetTokens?: number;
        level?: GoogleThinkingLevel;
    };
}
export declare const streamGoogle: StreamFunction<"google-generative-ai", GoogleOptions>;
export declare const streamSimpleGoogle: StreamFunction<"google-generative-ai", SimpleStreamOptions>;
//# sourceMappingURL=google.d.ts.map