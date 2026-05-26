import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ConnectorListUserCredentialsV1Request = {
    authType?: components.AuthenticationType | null | undefined;
    fetchDefault?: boolean | undefined;
    connectorIdOrName: string;
};
/** @internal */
export type ConnectorListUserCredentialsV1Request$Outbound = {
    auth_type?: string | null | undefined;
    fetch_default: boolean;
    connector_id_or_name: string;
};
/** @internal */
export declare const ConnectorListUserCredentialsV1Request$outboundSchema: z.ZodType<ConnectorListUserCredentialsV1Request$Outbound, ConnectorListUserCredentialsV1Request>;
export declare function connectorListUserCredentialsV1RequestToJSON(connectorListUserCredentialsV1Request: ConnectorListUserCredentialsV1Request): string;
//# sourceMappingURL=connectorlistusercredentialsv1.d.ts.map