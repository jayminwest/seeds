export function headersToRecord(headers) {
    const result = {};
    for (const [key, value] of headers.entries()) {
        result[key] = value;
    }
    return result;
}
//# sourceMappingURL=headers.js.map