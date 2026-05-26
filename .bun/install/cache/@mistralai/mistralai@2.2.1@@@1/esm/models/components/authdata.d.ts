import * as z from "zod/v4";
export type AuthData = {
    clientId: string;
    clientSecret: string;
};
/** @internal */
export type AuthData$Outbound = {
    client_id: string;
    client_secret: string;
};
/** @internal */
export declare const AuthData$outboundSchema: z.ZodType<AuthData$Outbound, AuthData>;
export declare function authDataToJSON(authData: AuthData): string;
//# sourceMappingURL=authdata.d.ts.map