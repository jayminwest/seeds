/**
 * Workaround for https://github.com/oven-sh/bun/issues/27802
 *
 * Bun compiled binaries have an empty `process.env` when running inside
 * sandbox environments (e.g. nono on Linux/macOS). On Linux we can recover
 * the environment from `/proc/self/environ`.
 */
/**
 * Restore environment variables from `/proc/self/environ` when running
 * inside a sandbox where Bun's `process.env` is empty.
 */
export declare function restoreSandboxEnv(): void;
//# sourceMappingURL=restore-sandbox-env.d.ts.map