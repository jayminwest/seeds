import * as z from "zod/v4";
export type ConnectorDeleteUserCredentialsV1Request = {
    credentialsName: string;
    connectorIdOrName: string;
};
/** @internal */
export type ConnectorDeleteUserCredentialsV1Request$Outbound = {
    credentials_name: string;
    connector_id_or_name: string;
};
/** @internal */
export declare const ConnectorDeleteUserCredentialsV1Request$outboundSchema: z.ZodType<ConnectorDeleteUserCredentialsV1Request$Outbound, ConnectorDeleteUserCredentialsV1Request>;
export declare function connectorDeleteUserCredentialsV1RequestToJSON(connectorDeleteUserCredentialsV1Request: ConnectorDeleteUserCredentialsV1Request): string;
//# sourceMappingURL=connectordeleteusercredentialsv1.d.ts.map