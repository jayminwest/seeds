import * as z from "zod/v4";
import * as components from "../components/index.js";
export type ConnectorUpdateV1Request = {
    connectorId: string;
    updateConnectorRequest: components.UpdateConnectorRequest;
};
/** @internal */
export type ConnectorUpdateV1Request$Outbound = {
    connector_id: string;
    UpdateConnectorRequest: components.UpdateConnectorRequest$Outbound;
};
/** @internal */
export declare const ConnectorUpdateV1Request$outboundSchema: z.ZodType<ConnectorUpdateV1Request$Outbound, ConnectorUpdateV1Request>;
export declare function connectorUpdateV1RequestToJSON(connectorUpdateV1Request: ConnectorUpdateV1Request): string;
//# sourceMappingURL=connectorupdatev1.d.ts.map