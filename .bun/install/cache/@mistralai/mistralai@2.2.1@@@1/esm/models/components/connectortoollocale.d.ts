import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ConnectorToolLocale = {
    name: {
        [k: string]: string;
    };
    description: {
        [k: string]: string;
    };
    usageSentence: {
        [k: string]: string;
    };
};
/** @internal */
export declare const ConnectorToolLocale$inboundSchema: z.ZodType<ConnectorToolLocale, unknown>;
export declare function connectorToolLocaleFromJSON(jsonString: string): SafeParseResult<ConnectorToolLocale, SDKValidationError>;
//# sourceMappingURL=connectortoollocale.d.ts.map