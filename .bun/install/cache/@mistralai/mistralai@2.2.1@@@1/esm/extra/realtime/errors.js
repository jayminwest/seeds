export class RealtimeTranscriptionException extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = "RealtimeTranscriptionException";
    }
}
export class RealtimeTranscriptionWSError extends RealtimeTranscriptionException {
    payload;
    rawPayload;
    code;
    constructor(message, options) {
        super(message, { cause: options?.cause });
        this.name = "RealtimeTranscriptionWSError";
        this.payload = options?.payload;
        this.rawPayload = options?.rawPayload;
        this.code = options?.code ?? options?.payload?.error?.code;
    }
}
//# sourceMappingURL=errors.js.map