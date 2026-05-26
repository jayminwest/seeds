import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ConnectorCreateOrUpdateOrganizationCredentialsV1Request = {
    connectorIdOrName: string;
    credentialsCreateOrUpdate: components.CredentialsCreateOrUpdate;
};
/** @internal */
export type ConnectorCreateOrUpdateOrganizationCredentialsV1Request$Outbound = {
    connector_id_or_name: string;
    CredentialsCreateOrUpdate: components.CredentialsCreateOrUpdate$Outbound;
};
/** @internal */
export declare const ConnectorCreateOrUpdateOrganizationCredentialsV1Request$outboundSchema: z.ZodType<ConnectorCreateOrUpdateOrganizationCredentialsV1Request$Outbound, ConnectorCreateOrUpdateOrganizationCredentialsV1Request>;
export declare function connectorCreateOrUpdateOrganizationCredentialsV1RequestToJSON(connectorCreateOrUpdateOrganizationCredentialsV1Request: ConnectorCreateOrUpdateOrganizationCredentialsV1Request): string;
//# sourceMappingURL=connectorcreateorupdateorganizationcredentialsv1.d.ts.map