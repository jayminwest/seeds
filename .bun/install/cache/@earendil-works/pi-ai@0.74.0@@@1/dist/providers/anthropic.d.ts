import Anthropic from "@anthropic-ai/sdk";
import type { SimpleStreamOptions, StreamFunction, StreamOptions } from "../types.js";
export type AnthropicEffort = "low" | "medium" | "high" | "xhigh" | "max";
export type AnthropicThinkingDisplay = "summarized" | "omitted";
export interface AnthropicOptions extends StreamOptions {
    /**
     * Enable extended thinking.
     * For Opus 4.6 and Sonnet 4.6: uses adaptive thinking (model decides when/how much to think).
     * For older models: uses budget-based thinking with thinkingBudgetTokens.
     */
    thinkingEnabled?: boolean;
    /**
     * Token budget for extended thinking (older models only).
     * Ignored for Opus 4.6 and Sonnet 4.6, which use adaptive thinking.
     */
    thinkingBudgetTokens?: number;
    /**
     * Effort level for adaptive thinking (Opus 4.6+ and Sonnet 4.6).
     * Controls how much thinking Claude allocates:
     * - "max": Always thinks with no constraints (Opus 4.6 only)
     * - "xhigh": Highest reasoning level (Opus 4.7)
     * - "high": Always thinks, deep reasoning (default)
     * - "medium": Moderate thinking, may skip for simple queries
     * - "low": Minimal thinking, skips for simple tasks
     * Ignored for older models.
     */
    effort?: AnthropicEffort;
    /**
     * Controls how thinking content is returned in API responses.
     * - "summarized": Thinking blocks contain summarized thinking text (default here).
     * - "omitted": Thinking blocks return an empty thinking field; the encrypted
     *   signature still travels back for multi-turn continuity. Use for faster
     *   time-to-first-text-token when your UI does not surface thinking.
     *
     * Note: Anthropic's API default for Claude Opus 4.7 and Claude Mythos Preview
     * is "omitted". We default to "summarized" here to keep behavior consistent
     * with older Claude 4 models. Set this explicitly to "omitted" to opt in.
     */
    thinkingDisplay?: AnthropicThinkingDisplay;
    interleavedThinking?: boolean;
    toolChoice?: "auto" | "any" | "none" | {
        type: "tool";
        name: string;
    };
    /**
     * Pre-built Anthropic client instance. When provided, skips internal client
     * construction entirely. Use this to inject alternative SDK clients such as
     * `AnthropicVertex` that shares the same messaging API.
     */
    client?: Anthropic;
}
export declare const streamAnthropic: StreamFunction<"anthropic-messages", AnthropicOptions>;
export declare const streamSimpleAnthropic: StreamFunction<"anthropic-messages", SimpleStreamOptions>;
//# sourceMappingURL=anthropic.d.ts.map