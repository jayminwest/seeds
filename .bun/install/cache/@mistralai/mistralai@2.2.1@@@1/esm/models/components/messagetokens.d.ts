import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Roles } from "./roles.js";
/**
 * Information on a single message included in a tokenized prompt as part of an InstructRequest.
 */
export type MessageTokens = {
    role: Roles;
    totalTokens?: number | null | undefined;
    truncated: boolean;
    usageCount: number;
};
/** @internal */
export declare const MessageTokens$inboundSchema: z.ZodType<MessageTokens, unknown>;
export declare function messageTokensFromJSON(jsonString: string): SafeParseResult<MessageTokens, SDKValidationError>;
//# sourceMappingURL=messagetokens.d.ts.map