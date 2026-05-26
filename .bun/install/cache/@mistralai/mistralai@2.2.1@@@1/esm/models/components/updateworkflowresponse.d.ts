import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type UpdateWorkflowResponse = {
    updateName: string;
    /**
     * The result of the Update workflow call
     */
    result: any;
};
/** @internal */
export declare const UpdateWorkflowResponse$inboundSchema: z.ZodType<UpdateWorkflowResponse, unknown>;
export declare function updateWorkflowResponseFromJSON(jsonString: string): SafeParseResult<UpdateWorkflowResponse, SDKValidationError>;
//# sourceMappingURL=updateworkflowresponse.d.ts.map