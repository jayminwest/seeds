import * as z from "zod/v4";
export type ConnectorDeleteOrganizationCredentialsV1Request = {
    credentialsName: string;
    connectorIdOrName: string;
};
/** @internal */
export type ConnectorDeleteOrganizationCredentialsV1Request$Outbound = {
    credentials_name: string;
    connector_id_or_name: string;
};
/** @internal */
export declare const ConnectorDeleteOrganizationCredentialsV1Request$outboundSchema: z.ZodType<ConnectorDeleteOrganizationCredentialsV1Request$Outbound, ConnectorDeleteOrganizationCredentialsV1Request>;
export declare function connectorDeleteOrganizationCredentialsV1RequestToJSON(connectorDeleteOrganizationCredentialsV1Request: ConnectorDeleteOrganizationCredentialsV1Request): string;
//# sourceMappingURL=connectordeleteorganizationcredentialsv1.d.ts.map