import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type OAuth2TokenAuth = {
    type: "oauth2-token";
    value: string;
};
/** @internal */
export declare const OAuth2TokenAuth$inboundSchema: z.ZodType<OAuth2TokenAuth, unknown>;
/** @internal */
export type OAuth2TokenAuth$Outbound = {
    type: "oauth2-token";
    value: string;
};
/** @internal */
export declare const OAuth2TokenAuth$outboundSchema: z.ZodType<OAuth2TokenAuth$Outbound, OAuth2TokenAuth>;
export declare function oAuth2TokenAuthToJSON(oAuth2TokenAuth: OAuth2TokenAuth): string;
export declare function oAuth2TokenAuthFromJSON(jsonString: string): SafeParseResult<OAuth2TokenAuth, SDKValidationError>;
//# sourceMappingURL=oauth2tokenauth.d.ts.map