import * as z from "zod/v4";
export type AgentsApiV1AgentsListVersionAliasesRequest = {
    agentId: string;
};
/** @internal */
export type AgentsApiV1AgentsListVersionAliasesRequest$Outbound = {
    agent_id: string;
};
/** @internal */
export declare const AgentsApiV1AgentsListVersionAliasesRequest$outboundSchema: z.ZodType<AgentsApiV1AgentsListVersionAliasesRequest$Outbound, AgentsApiV1AgentsListVersionAliasesRequest>;
export declare function agentsApiV1AgentsListVersionAliasesRequestToJSON(agentsApiV1AgentsListVersionAliasesRequest: AgentsApiV1AgentsListVersionAliasesRequest): string;
//# sourceMappingURL=agentsapiv1agentslistversionaliases.d.ts.map