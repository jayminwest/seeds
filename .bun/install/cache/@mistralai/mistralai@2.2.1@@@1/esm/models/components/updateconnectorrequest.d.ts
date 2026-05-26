import * as z from "zod/v4";
import { AuthData, AuthData$Outbound } from "./authdata.js";
export type UpdateConnectorRequest = {
    /**
     * The name of the connector.
     */
    name?: string | null | undefined;
    /**
     * The description of the connector.
     */
    description?: string | null | undefined;
    /**
     * The optional url of the icon you want to associate to the connector.
     */
    iconUrl?: string | null | undefined;
    /**
     * Optional system prompt for the connector.
     */
    systemPrompt?: string | null | undefined;
    /**
     * Optional new connection config.
     */
    connectionConfig?: {
        [k: string]: any;
    } | null | undefined;
    /**
     * Optional new connection secrets
     */
    connectionSecrets?: {
        [k: string]: any;
    } | null | undefined;
    /**
     * New server url for your mcp connector.
     */
    server?: string | null | undefined;
    /**
     * New headers for your mcp connector.
     */
    headers?: {
        [k: string]: any;
    } | null | undefined;
    /**
     * New authentication data for your mcp connector.
     */
    authData?: AuthData | null | undefined;
};
/** @internal */
export type UpdateConnectorRequest$Outbound = {
    name?: string | null | undefined;
    description?: string | null | undefined;
    icon_url?: string | null | undefined;
    system_prompt?: string | null | undefined;
    connection_config?: {
        [k: string]: any;
    } | null | undefined;
    connection_secrets?: {
        [k: string]: any;
    } | null | undefined;
    server?: string | null | undefined;
    headers?: {
        [k: string]: any;
    } | null | undefined;
    auth_data?: AuthData$Outbound | null | undefined;
};
/** @internal */
export declare const UpdateConnectorRequest$outboundSchema: z.ZodType<UpdateConnectorRequest$Outbound, UpdateConnectorRequest>;
export declare function updateConnectorRequestToJSON(updateConnectorRequest: UpdateConnectorRequest): string;
//# sourceMappingURL=updateconnectorrequest.d.ts.map