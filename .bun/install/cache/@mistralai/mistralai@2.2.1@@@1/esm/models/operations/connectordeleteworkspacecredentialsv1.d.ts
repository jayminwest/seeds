import * as z from "zod/v4";
export type ConnectorDeleteWorkspaceCredentialsV1Request = {
    credentialsName: string;
    connectorIdOrName: string;
};
/** @internal */
export type ConnectorDeleteWorkspaceCredentialsV1Request$Outbound = {
    credentials_name: string;
    connector_id_or_name: string;
};
/** @internal */
export declare const ConnectorDeleteWorkspaceCredentialsV1Request$outboundSchema: z.ZodType<ConnectorDeleteWorkspaceCredentialsV1Request$Outbound, ConnectorDeleteWorkspaceCredentialsV1Request>;
export declare function connectorDeleteWorkspaceCredentialsV1RequestToJSON(connectorDeleteWorkspaceCredentialsV1Request: ConnectorDeleteWorkspaceCredentialsV1Request): string;
//# sourceMappingURL=connectordeleteworkspacecredentialsv1.d.ts.map