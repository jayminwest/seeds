import type { ChildProcess } from "node:child_process";
export declare function shouldUseWindowsShell(command: string): boolean;
/**
 * Wait for a child process to terminate without hanging on inherited stdio handles.
 *
 * On Windows, daemonized descendants can inherit the child's stdout/stderr pipe
 * handles. In that case the child emits `exit`, but `close` can hang forever even
 * though the original process is already gone. We wait briefly for stdio to end,
 * then forcibly stop tracking the inherited handles.
 */
export declare function waitForChildProcess(child: ChildProcess): Promise<number | null>;
//# sourceMappingURL=child-process.d.ts.map