import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ConnectorListOrganizationCredentialsV1Request = {
    authType?: components.AuthenticationType | null | undefined;
    fetchDefault?: boolean | undefined;
    connectorIdOrName: string;
};
/** @internal */
export type ConnectorListOrganizationCredentialsV1Request$Outbound = {
    auth_type?: string | null | undefined;
    fetch_default: boolean;
    connector_id_or_name: string;
};
/** @internal */
export declare const ConnectorListOrganizationCredentialsV1Request$outboundSchema: z.ZodType<ConnectorListOrganizationCredentialsV1Request$Outbound, ConnectorListOrganizationCredentialsV1Request>;
export declare function connectorListOrganizationCredentialsV1RequestToJSON(connectorListOrganizationCredentialsV1Request: ConnectorListOrganizationCredentialsV1Request): string;
//# sourceMappingURL=connectorlistorganizationcredentialsv1.d.ts.map