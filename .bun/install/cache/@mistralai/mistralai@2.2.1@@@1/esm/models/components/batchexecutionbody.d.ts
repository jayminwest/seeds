import * as z from "zod/v4";
export type BatchExecutionBody = {
    /**
     * List of execution IDs to process
     */
    executionIds: Array<string>;
};
/** @internal */
export type BatchExecutionBody$Outbound = {
    execution_ids: Array<string>;
};
/** @internal */
export declare const BatchExecutionBody$outboundSchema: z.ZodType<BatchExecutionBody$Outbound, BatchExecutionBody>;
export declare function batchExecutionBodyToJSON(batchExecutionBody: BatchExecutionBody): string;
//# sourceMappingURL=batchexecutionbody.d.ts.map