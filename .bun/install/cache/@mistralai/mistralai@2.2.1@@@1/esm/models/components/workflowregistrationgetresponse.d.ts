import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowRegistrationWithWorkerStatus } from "./workflowregistrationwithworkerstatus.js";
export type WorkflowRegistrationGetResponse = {
    workflowRegistration: WorkflowRegistrationWithWorkerStatus;
    workflowVersion: WorkflowRegistrationWithWorkerStatus;
};
/** @internal */
export declare const WorkflowRegistrationGetResponse$inboundSchema: z.ZodType<WorkflowRegistrationGetResponse, unknown>;
export declare function workflowRegistrationGetResponseFromJSON(jsonString: string): SafeParseResult<WorkflowRegistrationGetResponse, SDKValidationError>;
//# sourceMappingURL=workflowregistrationgetresponse.d.ts.map