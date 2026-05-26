import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const AuthenticationType: {
    readonly Oauth2: "oauth2";
    readonly Bearer: "bearer";
    readonly None: "none";
};
export type AuthenticationType = OpenEnum<typeof AuthenticationType>;
/** @internal */
export declare const AuthenticationType$inboundSchema: z.ZodType<AuthenticationType, unknown>;
/** @internal */
export declare const AuthenticationType$outboundSchema: z.ZodType<string, AuthenticationType>;
//# sourceMappingURL=authenticationtype.d.ts.map