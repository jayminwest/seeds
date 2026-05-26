import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ConnectorCreateOrUpdateWorkspaceCredentialsV1Request = {
    connectorIdOrName: string;
    credentialsCreateOrUpdate: components.CredentialsCreateOrUpdate;
};
/** @internal */
export type ConnectorCreateOrUpdateWorkspaceCredentialsV1Request$Outbound = {
    connector_id_or_name: string;
    CredentialsCreateOrUpdate: components.CredentialsCreateOrUpdate$Outbound;
};
/** @internal */
export declare const ConnectorCreateOrUpdateWorkspaceCredentialsV1Request$outboundSchema: z.ZodType<ConnectorCreateOrUpdateWorkspaceCredentialsV1Request$Outbound, ConnectorCreateOrUpdateWorkspaceCredentialsV1Request>;
export declare function connectorCreateOrUpdateWorkspaceCredentialsV1RequestToJSON(connectorCreateOrUpdateWorkspaceCredentialsV1Request: ConnectorCreateOrUpdateWorkspaceCredentialsV1Request): string;
//# sourceMappingURL=connectorcreateorupdateworkspacecredentialsv1.d.ts.map