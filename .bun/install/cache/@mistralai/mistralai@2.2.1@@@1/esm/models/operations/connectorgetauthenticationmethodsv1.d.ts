import * as z from "zod/v4";
export type ConnectorGetAuthenticationMethodsV1Request = {
    connectorIdOrName: string;
};
/** @internal */
export type ConnectorGetAuthenticationMethodsV1Request$Outbound = {
    connector_id_or_name: string;
};
/** @internal */
export declare const ConnectorGetAuthenticationMethodsV1Request$outboundSchema: z.ZodType<ConnectorGetAuthenticationMethodsV1Request$Outbound, ConnectorGetAuthenticationMethodsV1Request>;
export declare function connectorGetAuthenticationMethodsV1RequestToJSON(connectorGetAuthenticationMethodsV1Request: ConnectorGetAuthenticationMethodsV1Request): string;
//# sourceMappingURL=connectorgetauthenticationmethodsv1.d.ts.map