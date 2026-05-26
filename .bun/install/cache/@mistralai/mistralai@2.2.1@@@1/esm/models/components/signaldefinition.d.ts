import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type SignalDefinition = {
    /**
     * Name of the signal
     */
    name: string;
    /**
     * Description of the signal
     */
    description?: string | null | undefined;
    /**
     * Input JSON schema of the signal's model
     */
    inputSchema: {
        [k: string]: any;
    };
};
/** @internal */
export declare const SignalDefinition$inboundSchema: z.ZodType<SignalDefinition, unknown>;
export declare function signalDefinitionFromJSON(jsonString: string): SafeParseResult<SignalDefinition, SDKValidationError>;
//# sourceMappingURL=signaldefinition.d.ts.map