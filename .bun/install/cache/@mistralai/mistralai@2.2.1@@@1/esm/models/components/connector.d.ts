import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type Connector = {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    modifiedAt: Date;
    server?: string | null | undefined;
    authType?: string | null | undefined;
};
/** @internal */
export declare const Connector$inboundSchema: z.ZodType<Connector, unknown>;
export declare function connectorFromJSON(jsonString: string): SafeParseResult<Connector, SDKValidationError>;
//# sourceMappingURL=connector.d.ts.map