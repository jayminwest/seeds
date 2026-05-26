import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { AuthenticationType } from "./authenticationtype.js";
import { ConnectorAuthenticationHeader } from "./connectorauthenticationheader.js";
/**
 * Public view of an authentication method, without secrets.
 */
export type PublicAuthenticationMethod = {
    methodType: AuthenticationType;
    headers?: Array<ConnectorAuthenticationHeader> | null | undefined;
};
/** @internal */
export declare const PublicAuthenticationMethod$inboundSchema: z.ZodType<PublicAuthenticationMethod, unknown>;
export declare function publicAuthenticationMethodFromJSON(jsonString: string): SafeParseResult<PublicAuthenticationMethod, SDKValidationError>;
//# sourceMappingURL=publicauthenticationmethod.d.ts.map