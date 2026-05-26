import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ConnectorCreateOrUpdateUserCredentialsV1Request = {
    connectorIdOrName: string;
    credentialsCreateOrUpdate: components.CredentialsCreateOrUpdate;
};
/** @internal */
export type ConnectorCreateOrUpdateUserCredentialsV1Request$Outbound = {
    connector_id_or_name: string;
    CredentialsCreateOrUpdate: components.CredentialsCreateOrUpdate$Outbound;
};
/** @internal */
export declare const ConnectorCreateOrUpdateUserCredentialsV1Request$outboundSchema: z.ZodType<ConnectorCreateOrUpdateUserCredentialsV1Request$Outbound, ConnectorCreateOrUpdateUserCredentialsV1Request>;
export declare function connectorCreateOrUpdateUserCredentialsV1RequestToJSON(connectorCreateOrUpdateUserCredentialsV1Request: ConnectorCreateOrUpdateUserCredentialsV1Request): string;
//# sourceMappingURL=connectorcreateorupdateusercredentialsv1.d.ts.map