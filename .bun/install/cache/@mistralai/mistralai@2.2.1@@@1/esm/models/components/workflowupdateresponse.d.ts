import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Workflow } from "./workflow.js";
export type WorkflowUpdateResponse = {
    workflow: Workflow;
};
/** @internal */
export declare const WorkflowUpdateResponse$inboundSchema: z.ZodType<WorkflowUpdateResponse, unknown>;
export declare function workflowUpdateResponseFromJSON(jsonString: string): SafeParseResult<WorkflowUpdateResponse, SDKValidationError>;
//# sourceMappingURL=workflowupdateresponse.d.ts.map