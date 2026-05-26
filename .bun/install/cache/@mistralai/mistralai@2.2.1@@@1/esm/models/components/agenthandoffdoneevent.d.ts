import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type AgentHandoffDoneEvent = {
    type: "agent.handoff.done";
    createdAt?: Date | undefined;
    outputIndex: number;
    id: string;
    nextAgentId: string;
    nextAgentName: string;
};
/** @internal */
export declare const AgentHandoffDoneEvent$inboundSchema: z.ZodType<AgentHandoffDoneEvent, unknown>;
export declare function agentHandoffDoneEventFromJSON(jsonString: string): SafeParseResult<AgentHandoffDoneEvent, SDKValidationError>;
//# sourceMappingURL=agenthandoffdoneevent.d.ts.map