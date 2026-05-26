import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { TempoTraceBatch } from "./tempotracebatch.js";
/**
 * Trace response in OpenTelemetry format.
 *
 * @remarks
 *
 * This is the unified trace format used across all trace providers (Tempo, ClickHouse, etc.).
 * Regardless of the underlying backend, all trace data is normalized to this Tempo-compatible
 * OpenTelemetry format to ensure consistency in the API response structure.
 */
export type TempoGetTraceResponse = {
    /**
     * The batches of the trace
     */
    batches?: Array<TempoTraceBatch> | undefined;
};
/** @internal */
export declare const TempoGetTraceResponse$inboundSchema: z.ZodType<TempoGetTraceResponse, unknown>;
export declare function tempoGetTraceResponseFromJSON(jsonString: string): SafeParseResult<TempoGetTraceResponse, SDKValidationError>;
//# sourceMappingURL=tempogettraceresponse.d.ts.map