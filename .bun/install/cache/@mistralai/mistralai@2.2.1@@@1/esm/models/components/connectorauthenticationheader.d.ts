import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ConnectorAuthenticationHeader = {
    name: string;
    isRequired: boolean;
    isSecret: boolean;
};
/** @internal */
export declare const ConnectorAuthenticationHeader$inboundSchema: z.ZodType<ConnectorAuthenticationHeader, unknown>;
export declare function connectorAuthenticationHeaderFromJSON(jsonString: string): SafeParseResult<ConnectorAuthenticationHeader, SDKValidationError>;
//# sourceMappingURL=connectorauthenticationheader.d.ts.map