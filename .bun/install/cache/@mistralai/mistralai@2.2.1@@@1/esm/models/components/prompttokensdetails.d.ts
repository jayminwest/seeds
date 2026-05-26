import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { MessageTokens } from "./messagetokens.js";
/**
 * Token usage details for the prompt.
 */
export type PromptTokensDetails = {
    messages?: Array<MessageTokens> | undefined;
    cachedTokens: number;
};
/** @internal */
export declare const PromptTokensDetails$inboundSchema: z.ZodType<PromptTokensDetails, unknown>;
export declare function promptTokensDetailsFromJSON(jsonString: string): SafeParseResult<PromptTokensDetails, SDKValidationError>;
//# sourceMappingURL=prompttokensdetails.d.ts.map