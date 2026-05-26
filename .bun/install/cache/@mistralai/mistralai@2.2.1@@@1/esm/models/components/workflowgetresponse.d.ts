import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowWithWorkerStatus } from "./workflowwithworkerstatus.js";
export type WorkflowGetResponse = {
    workflow: WorkflowWithWorkerStatus;
};
/** @internal */
export declare const WorkflowGetResponse$inboundSchema: z.ZodType<WorkflowGetResponse, unknown>;
export declare function workflowGetResponseFromJSON(jsonString: string): SafeParseResult<WorkflowGetResponse, SDKValidationError>;
//# sourceMappingURL=workflowgetresponse.d.ts.map