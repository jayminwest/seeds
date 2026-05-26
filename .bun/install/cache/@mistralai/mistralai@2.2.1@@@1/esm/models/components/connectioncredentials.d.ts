import * as z from "zod/v4";
import { OAuth2Token, OAuth2Token$Outbound } from "./oauth2token.js";
export type ConnectionCredentials = {
    oauth?: OAuth2Token | null | undefined;
    headers?: {
        [k: string]: string;
    } | null | undefined;
    bearerToken?: string | null | undefined;
};
/** @internal */
export type ConnectionCredentials$Outbound = {
    oauth?: OAuth2Token$Outbound | null | undefined;
    headers?: {
        [k: string]: string;
    } | null | undefined;
    bearer_token?: string | null | undefined;
};
/** @internal */
export declare const ConnectionCredentials$outboundSchema: z.ZodType<ConnectionCredentials$Outbound, ConnectionCredentials>;
export declare function connectionCredentialsToJSON(connectionCredentials: ConnectionCredentials): string;
//# sourceMappingURL=connectioncredentials.d.ts.map