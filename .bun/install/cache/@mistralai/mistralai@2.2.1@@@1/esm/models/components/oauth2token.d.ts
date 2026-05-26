import * as z from "zod/v4";
export type OAuth2Token = {
    accessToken: string;
    tokenType?: "Bearer" | undefined;
    expiresIn?: number | null | undefined;
    scope?: string | null | undefined;
    refreshToken?: string | null | undefined;
    expiresAt?: Date | null | undefined;
};
/** @internal */
export type OAuth2Token$Outbound = {
    access_token: string;
    token_type: "Bearer";
    expires_in?: number | null | undefined;
    scope?: string | null | undefined;
    refresh_token?: string | null | undefined;
    expires_at?: string | null | undefined;
};
/** @internal */
export declare const OAuth2Token$outboundSchema: z.ZodType<OAuth2Token$Outbound, OAuth2Token>;
export declare function oAuth2TokenToJSON(oAuth2Token: OAuth2Token): string;
//# sourceMappingURL=oauth2token.d.ts.map