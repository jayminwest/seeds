import { realpathSync } from "node:fs";
import { resolve } from "node:path";
const fileMutationQueues = new Map();
function getMutationQueueKey(filePath) {
    const resolvedPath = resolve(filePath);
    try {
        return realpathSync.native(resolvedPath);
    }
    catch {
        return resolvedPath;
    }
}
/**
 * Serialize file mutation operations targeting the same file.
 * Operations for different files still run in parallel.
 */
export async function withFileMutationQueue(filePath, fn) {
    const key = getMutationQueueKey(filePath);
    const currentQueue = fileMutationQueues.get(key) ?? Promise.resolve();
    let releaseNext;
    const nextQueue = new Promise((resolveQueue) => {
        releaseNext = resolveQueue;
    });
    const chainedQueue = currentQueue.then(() => nextQueue);
    fileMutationQueues.set(key, chainedQueue);
    await currentQueue;
    try {
        return await fn();
    }
    finally {
        releaseNext();
        if (fileMutationQueues.get(key) === chainedQueue) {
            fileMutationQueues.delete(key);
        }
    }
}
//# sourceMappingURL=file-mutation-queue.js.map