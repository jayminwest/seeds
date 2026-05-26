import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type QueryDefinition = {
    /**
     * Name of the query
     */
    name: string;
    /**
     * Description of the query
     */
    description?: string | null | undefined;
    /**
     * Input JSON schema of the query's model
     */
    inputSchema: {
        [k: string]: any;
    };
    /**
     * Output JSON schema of the query's model
     */
    outputSchema?: {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export declare const QueryDefinition$inboundSchema: z.ZodType<QueryDefinition, unknown>;
export declare function queryDefinitionFromJSON(jsonString: string): SafeParseResult<QueryDefinition, SDKValidationError>;
//# sourceMappingURL=querydefinition.d.ts.map