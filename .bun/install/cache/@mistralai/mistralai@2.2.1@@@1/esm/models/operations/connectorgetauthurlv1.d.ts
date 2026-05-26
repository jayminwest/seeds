import * as z from "zod/v4";
export type ConnectorGetAuthUrlV1Request = {
    appReturnUrl?: string | null | undefined;
    credentialsName?: string | null | undefined;
    connectorIdOrName: string;
};
/** @internal */
export type ConnectorGetAuthUrlV1Request$Outbound = {
    app_return_url?: string | null | undefined;
    credentials_name?: string | null | undefined;
    connector_id_or_name: string;
};
/** @internal */
export declare const ConnectorGetAuthUrlV1Request$outboundSchema: z.ZodType<ConnectorGetAuthUrlV1Request$Outbound, ConnectorGetAuthUrlV1Request>;
export declare function connectorGetAuthUrlV1RequestToJSON(connectorGetAuthUrlV1Request: ConnectorGetAuthUrlV1Request): string;
//# sourceMappingURL=connectorgetauthurlv1.d.ts.map