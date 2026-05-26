import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type UpdateDefinition = {
    /**
     * Name of the update
     */
    name: string;
    /**
     * Description of the update
     */
    description?: string | null | undefined;
    /**
     * Input JSON schema of the update's model
     */
    inputSchema: {
        [k: string]: any;
    };
    /**
     * Output JSON schema of the update's model
     */
    outputSchema?: {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export declare const UpdateDefinition$inboundSchema: z.ZodType<UpdateDefinition, unknown>;
export declare function updateDefinitionFromJSON(jsonString: string): SafeParseResult<UpdateDefinition, SDKValidationError>;
//# sourceMappingURL=updatedefinition.d.ts.map