import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { AuthenticationType } from "./authenticationtype.js";
export type AuthenticationConfiguration = {
    name: string;
    authenticationType: AuthenticationType;
    isDefault: boolean;
};
/** @internal */
export declare const AuthenticationConfiguration$inboundSchema: z.ZodType<AuthenticationConfiguration, unknown>;
export declare function authenticationConfigurationFromJSON(jsonString: string): SafeParseResult<AuthenticationConfiguration, SDKValidationError>;
//# sourceMappingURL=authenticationconfiguration.d.ts.map