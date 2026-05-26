import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ConnectorListWorkspaceCredentialsV1Request = {
    authType?: components.AuthenticationType | null | undefined;
    fetchDefault?: boolean | undefined;
    connectorIdOrName: string;
};
/** @internal */
export type ConnectorListWorkspaceCredentialsV1Request$Outbound = {
    auth_type?: string | null | undefined;
    fetch_default: boolean;
    connector_id_or_name: string;
};
/** @internal */
export declare const ConnectorListWorkspaceCredentialsV1Request$outboundSchema: z.ZodType<ConnectorListWorkspaceCredentialsV1Request$Outbound, ConnectorListWorkspaceCredentialsV1Request>;
export declare function connectorListWorkspaceCredentialsV1RequestToJSON(connectorListWorkspaceCredentialsV1Request: ConnectorListWorkspaceCredentialsV1Request): string;
//# sourceMappingURL=connectorlistworkspacecredentialsv1.d.ts.map