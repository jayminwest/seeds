import * as z from "zod/v4";
/**
 * Request body for calling an MCP tool.
 */
export type ConnectorCallToolRequest = {
    arguments?: {
        [k: string]: any;
    } | undefined;
};
/** @internal */
export type ConnectorCallToolRequest$Outbound = {
    arguments?: {
        [k: string]: any;
    } | undefined;
};
/** @internal */
export declare const ConnectorCallToolRequest$outboundSchema: z.ZodType<ConnectorCallToolRequest$Outbound, ConnectorCallToolRequest>;
export declare function connectorCallToolRequestToJSON(connectorCallToolRequest: ConnectorCallToolRequest): string;
//# sourceMappingURL=connectorcalltoolrequest.d.ts.map