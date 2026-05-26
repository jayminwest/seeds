import * as z from "zod/v4";
import * as components from "../components/index.js";
export type AgentsApiV1AgentsUpdateRequest = {
    agentId: string;
    updateAgentRequest: components.UpdateAgentRequest;
};
/** @internal */
export type AgentsApiV1AgentsUpdateRequest$Outbound = {
    agent_id: string;
    UpdateAgentRequest: components.UpdateAgentRequest$Outbound;
};
/** @internal */
export declare const AgentsApiV1AgentsUpdateRequest$outboundSchema: z.ZodType<AgentsApiV1AgentsUpdateRequest$Outbound, AgentsApiV1AgentsUpdateRequest>;
export declare function agentsApiV1AgentsUpdateRequestToJSON(agentsApiV1AgentsUpdateRequest: AgentsApiV1AgentsUpdateRequest): string;
//# sourceMappingURL=agentsapiv1agentsupdate.d.ts.map