import * as z from "zod/v4";
export type ResetInvocationBody = {
    /**
     * The event ID to reset the workflow execution to
     */
    eventId: number;
    /**
     * Reason for resetting the workflow execution
     */
    reason?: string | null | undefined;
    /**
     * Whether to exclude signals that happened after the reset point
     */
    excludeSignals?: boolean | undefined;
    /**
     * Whether to exclude updates that happened after the reset point
     */
    excludeUpdates?: boolean | undefined;
};
/** @internal */
export type ResetInvocationBody$Outbound = {
    event_id: number;
    reason?: string | null | undefined;
    exclude_signals: boolean;
    exclude_updates: boolean;
};
/** @internal */
export declare const ResetInvocationBody$outboundSchema: z.ZodType<ResetInvocationBody$Outbound, ResetInvocationBody>;
export declare function resetInvocationBodyToJSON(resetInvocationBody: ResetInvocationBody): string;
//# sourceMappingURL=resetinvocationbody.d.ts.map