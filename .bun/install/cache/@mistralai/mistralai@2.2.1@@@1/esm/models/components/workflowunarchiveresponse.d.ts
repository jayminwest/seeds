import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Workflow } from "./workflow.js";
export type WorkflowUnarchiveResponse = {
    workflow: Workflow;
};
/** @internal */
export declare const WorkflowUnarchiveResponse$inboundSchema: z.ZodType<WorkflowUnarchiveResponse, unknown>;
export declare function workflowUnarchiveResponseFromJSON(jsonString: string): SafeParseResult<WorkflowUnarchiveResponse, SDKValidationError>;
//# sourceMappingURL=workflowunarchiveresponse.d.ts.map