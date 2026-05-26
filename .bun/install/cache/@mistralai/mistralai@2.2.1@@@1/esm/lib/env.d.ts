import * as z from "zod/v4";
export interface Env {
    MISTRAL_API_KEY?: string | undefined;
    MISTRAL_DEBUG?: boolean | undefined;
}
export declare const envSchema: z.ZodType<Env, unknown>;
/**
 * Reads and validates environment variables.
 */
export declare function env(): Env;
/**
 * Clears the cached env object. Useful for testing with a fresh environment.
 */
export declare function resetEnv(): void;
//# sourceMappingURL=env.d.ts.map