import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { APIKeyAuth, APIKeyAuth$Outbound } from "./apikeyauth.js";
import { OAuth2TokenAuth, OAuth2TokenAuth$Outbound } from "./oauth2tokenauth.js";
import { ToolConfiguration, ToolConfiguration$Outbound } from "./toolconfiguration.js";
export type Authorization = APIKeyAuth | OAuth2TokenAuth | discriminatedUnionTypes.Unknown<"type">;
export type CustomConnector = {
    type: "connector";
    connectorId: string;
    authorization?: APIKeyAuth | OAuth2TokenAuth | discriminatedUnionTypes.Unknown<"type"> | null | undefined;
    toolConfiguration?: ToolConfiguration | null | undefined;
};
/** @internal */
export declare const Authorization$inboundSchema: z.ZodType<Authorization, unknown>;
/** @internal */
export type Authorization$Outbound = APIKeyAuth$Outbound | OAuth2TokenAuth$Outbound;
/** @internal */
export declare const Authorization$outboundSchema: z.ZodType<Authorization$Outbound, Authorization>;
export declare function authorizationToJSON(authorization: Authorization): string;
export declare function authorizationFromJSON(jsonString: string): SafeParseResult<Authorization, SDKValidationError>;
/** @internal */
export declare const CustomConnector$inboundSchema: z.ZodType<CustomConnector, unknown>;
/** @internal */
export type CustomConnector$Outbound = {
    type: "connector";
    connector_id: string;
    authorization?: APIKeyAuth$Outbound | OAuth2TokenAuth$Outbound | null | undefined;
    tool_configuration?: ToolConfiguration$Outbound | null | undefined;
};
/** @internal */
export declare const CustomConnector$outboundSchema: z.ZodType<CustomConnector$Outbound, CustomConnector>;
export declare function customConnectorToJSON(customConnector: CustomConnector): string;
export declare function customConnectorFromJSON(jsonString: string): SafeParseResult<CustomConnector, SDKValidationError>;
//# sourceMappingURL=customconnector.d.ts.map