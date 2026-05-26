import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type QueryWorkflowResponse = {
    queryName: string;
    /**
     * The result of the Query workflow call
     */
    result: any;
};
/** @internal */
export declare const QueryWorkflowResponse$inboundSchema: z.ZodType<QueryWorkflowResponse, unknown>;
export declare function queryWorkflowResponseFromJSON(jsonString: string): SafeParseResult<QueryWorkflowResponse, SDKValidationError>;
//# sourceMappingURL=queryworkflowresponse.d.ts.map