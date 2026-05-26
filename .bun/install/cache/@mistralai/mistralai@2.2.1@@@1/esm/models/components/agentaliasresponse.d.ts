import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type AgentAliasResponse = {
    alias: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
};
/** @internal */
export declare const AgentAliasResponse$inboundSchema: z.ZodType<AgentAliasResponse, unknown>;
export declare function agentAliasResponseFromJSON(jsonString: string): SafeParseResult<AgentAliasResponse, SDKValidationError>;
//# sourceMappingURL=agentaliasresponse.d.ts.map