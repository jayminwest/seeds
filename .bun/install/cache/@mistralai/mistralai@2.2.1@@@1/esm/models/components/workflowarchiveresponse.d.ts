import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Workflow } from "./workflow.js";
export type WorkflowArchiveResponse = {
    workflow: Workflow;
};
/** @internal */
export declare const WorkflowArchiveResponse$inboundSchema: z.ZodType<WorkflowArchiveResponse, unknown>;
export declare function workflowArchiveResponseFromJSON(jsonString: string): SafeParseResult<WorkflowArchiveResponse, SDKValidationError>;
//# sourceMappingURL=workflowarchiveresponse.d.ts.map