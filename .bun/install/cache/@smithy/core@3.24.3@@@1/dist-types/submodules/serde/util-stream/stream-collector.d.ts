import { type Readable } from "node:stream";
import type { ReadableStream as IReadableStream } from "node:stream/web";
export declare const streamCollector: (stream: Readable | IReadableStream) => Promise<Uint8Array>;
