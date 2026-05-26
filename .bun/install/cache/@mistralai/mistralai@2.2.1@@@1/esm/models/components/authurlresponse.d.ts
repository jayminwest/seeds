import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type AuthUrlResponse = {
    authUrl: string;
    ttl: number;
};
/** @internal */
export declare const AuthUrlResponse$inboundSchema: z.ZodType<AuthUrlResponse, unknown>;
export declare function authUrlResponseFromJSON(jsonString: string): SafeParseResult<AuthUrlResponse, SDKValidationError>;
//# sourceMappingURL=authurlresponse.d.ts.map