import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type APIKeyAuth = {
    type: "api-key";
    value: string;
};
/** @internal */
export declare const APIKeyAuth$inboundSchema: z.ZodType<APIKeyAuth, unknown>;
/** @internal */
export type APIKeyAuth$Outbound = {
    type: "api-key";
    value: string;
};
/** @internal */
export declare const APIKeyAuth$outboundSchema: z.ZodType<APIKeyAuth$Outbound, APIKeyAuth>;
export declare function apiKeyAuthToJSON(apiKeyAuth: APIKeyAuth): string;
export declare function apiKeyAuthFromJSON(jsonString: string): SafeParseResult<APIKeyAuth, SDKValidationError>;
//# sourceMappingURL=apikeyauth.d.ts.map