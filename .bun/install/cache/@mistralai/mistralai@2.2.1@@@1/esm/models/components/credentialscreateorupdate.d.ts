import * as z from "zod/v4";
import { ConnectionCredentials, ConnectionCredentials$Outbound } from "./connectioncredentials.js";
/**
 * Request to create or update non-OAuth2 credentials for a connector.
 */
export type CredentialsCreateOrUpdate = {
    /**
     * Name of the credentials. Use this name to access or modify your credentials.
     */
    name: string;
    /**
     * Controls whether this credential is the default for its auth method. On creation: if no credential exists yet for this auth method, the credential is automatically set as default when is_default is true or omitted; setting is_default to false is rejected because a default must exist. If other credentials already exist, setting is_default to true promotes this credential (demoting the previous default); false or omitted creates it as non-default. On update: true promotes this credential, false is rejected if it is currently the default (promote another credential first), omitted leaves the default status unchanged.
     */
    isDefault?: boolean | null | undefined;
    /**
     * The credential data (headers, bearer_token).
     */
    credentials?: ConnectionCredentials | null | undefined;
};
/** @internal */
export type CredentialsCreateOrUpdate$Outbound = {
    name: string;
    is_default?: boolean | null | undefined;
    credentials?: ConnectionCredentials$Outbound | null | undefined;
};
/** @internal */
export declare const CredentialsCreateOrUpdate$outboundSchema: z.ZodType<CredentialsCreateOrUpdate$Outbound, CredentialsCreateOrUpdate>;
export declare function credentialsCreateOrUpdateToJSON(credentialsCreateOrUpdate: CredentialsCreateOrUpdate): string;
//# sourceMappingURL=credentialscreateorupdate.d.ts.map