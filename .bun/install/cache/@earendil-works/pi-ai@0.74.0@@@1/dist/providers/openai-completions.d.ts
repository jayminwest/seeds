import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";
import type { Context, Model, OpenAICompletionsCompat, SimpleStreamOptions, StreamFunction, StreamOptions } from "../types.js";
export interface OpenAICompletionsOptions extends StreamOptions {
    toolChoice?: "auto" | "none" | "required" | {
        type: "function";
        function: {
            name: string;
        };
    };
    reasoningEffort?: "minimal" | "low" | "medium" | "high" | "xhigh";
}
type ResolvedOpenAICompletionsCompat = Omit<Required<OpenAICompletionsCompat>, "cacheControlFormat"> & {
    cacheControlFormat?: OpenAICompletionsCompat["cacheControlFormat"];
};
export declare const streamOpenAICompletions: StreamFunction<"openai-completions", OpenAICompletionsOptions>;
export declare const streamSimpleOpenAICompletions: StreamFunction<"openai-completions", SimpleStreamOptions>;
export declare function convertMessages(model: Model<"openai-completions">, context: Context, compat: ResolvedOpenAICompletionsCompat): ChatCompletionMessageParam[];
export {};
//# sourceMappingURL=openai-completions.d.ts.map