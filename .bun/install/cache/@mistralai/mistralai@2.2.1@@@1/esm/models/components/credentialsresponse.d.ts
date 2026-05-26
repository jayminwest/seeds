import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { AuthenticationConfiguration } from "./authenticationconfiguration.js";
import { AuthenticationType } from "./authenticationtype.js";
export type CredentialsResponse = {
    credentials: Array<AuthenticationConfiguration>;
    connectorPresetCredentialsForAuth?: Array<AuthenticationType> | undefined;
};
/** @internal */
export declare const CredentialsResponse$inboundSchema: z.ZodType<CredentialsResponse, unknown>;
export declare function credentialsResponseFromJSON(jsonString: string): SafeParseResult<CredentialsResponse, SDKValidationError>;
//# sourceMappingURL=credentialsresponse.d.ts.map