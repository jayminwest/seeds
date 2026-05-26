import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ConnectorCallToolV1Request = {
    toolName: string;
    credentialsName?: string | null | undefined;
    connectorIdOrName: string;
    connectorCallToolRequest: components.ConnectorCallToolRequest;
};
/** @internal */
export type ConnectorCallToolV1Request$Outbound = {
    tool_name: string;
    credentials_name?: string | null | undefined;
    connector_id_or_name: string;
    ConnectorCallToolRequest: components.ConnectorCallToolRequest$Outbound;
};
/** @internal */
export declare const ConnectorCallToolV1Request$outboundSchema: z.ZodType<ConnectorCallToolV1Request$Outbound, ConnectorCallToolV1Request>;
export declare function connectorCallToolV1RequestToJSON(connectorCallToolV1Request: ConnectorCallToolV1Request): string;
//# sourceMappingURL=connectorcalltoolv1.d.ts.map