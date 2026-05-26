import * as z from "zod/v4";
export type AgentsApiV1AgentsCreateOrUpdateAliasRequest = {
    agentId: string;
    alias: string;
    version: number;
};
/** @internal */
export type AgentsApiV1AgentsCreateOrUpdateAliasRequest$Outbound = {
    agent_id: string;
    alias: string;
    version: number;
};
/** @internal */
export declare const AgentsApiV1AgentsCreateOrUpdateAliasRequest$outboundSchema: z.ZodType<AgentsApiV1AgentsCreateOrUpdateAliasRequest$Outbound, AgentsApiV1AgentsCreateOrUpdateAliasRequest>;
export declare function agentsApiV1AgentsCreateOrUpdateAliasRequestToJSON(agentsApiV1AgentsCreateOrUpdateAliasRequest: AgentsApiV1AgentsCreateOrUpdateAliasRequest): string;
//# sourceMappingURL=agentsapiv1agentscreateorupdatealias.d.ts.map