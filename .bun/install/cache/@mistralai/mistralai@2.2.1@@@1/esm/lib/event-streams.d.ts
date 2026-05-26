declare global {
    interface ReadableStream<R = any> {
        [Symbol.asyncIterator](): AsyncIterableIterator<R>;
    }
}
export type SseMessage<T> = {
    data?: T | undefined;
    event?: string | null | undefined;
    id?: string | null | undefined;
    retry?: number | null | undefined;
};
export declare class EventStream<T extends SseMessage<unknown>> extends ReadableStream<T> {
    constructor(responseBody: ReadableStream<Uint8Array>, parse: (x: SseMessage<string>) => IteratorResult<T, undefined>, opts?: {
        dataRequired?: boolean;
    });
    [Symbol.asyncIterator](): AsyncIterableIterator<T>;
}
//# sourceMappingURL=event-streams.d.ts.map