import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type AgentHandoffStartedEvent = {
    type: "agent.handoff.started";
    createdAt?: Date | undefined;
    outputIndex: number;
    id: string;
    previousAgentId: string;
    previousAgentName: string;
};
/** @internal */
export declare const AgentHandoffStartedEvent$inboundSchema: z.ZodType<AgentHandoffStartedEvent, unknown>;
export declare function agentHandoffStartedEventFromJSON(jsonString: string): SafeParseResult<AgentHandoffStartedEvent, SDKValidationError>;
//# sourceMappingURL=agenthandoffstartedevent.d.ts.map