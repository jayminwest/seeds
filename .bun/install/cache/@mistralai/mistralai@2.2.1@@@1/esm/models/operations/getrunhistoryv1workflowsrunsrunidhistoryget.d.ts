import * as z from "zod/v4";
export type GetRunHistoryV1WorkflowsRunsRunIdHistoryGetRequest = {
    runId: string;
    decodePayloads?: boolean | undefined;
};
/** @internal */
export type GetRunHistoryV1WorkflowsRunsRunIdHistoryGetRequest$Outbound = {
    run_id: string;
    decode_payloads: boolean;
};
/** @internal */
export declare const GetRunHistoryV1WorkflowsRunsRunIdHistoryGetRequest$outboundSchema: z.ZodType<GetRunHistoryV1WorkflowsRunsRunIdHistoryGetRequest$Outbound, GetRunHistoryV1WorkflowsRunsRunIdHistoryGetRequest>;
export declare function getRunHistoryV1WorkflowsRunsRunIdHistoryGetRequestToJSON(getRunHistoryV1WorkflowsRunsRunIdHistoryGetRequest: GetRunHistoryV1WorkflowsRunsRunIdHistoryGetRequest): string;
//# sourceMappingURL=getrunhistoryv1workflowsrunsrunidhistoryget.d.ts.map