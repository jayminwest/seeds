import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowRegistration } from "./workflowregistration.js";
export type WorkflowRegistrationListResponse = {
    /**
     * A list of workflow registrations
     */
    workflowRegistrations: Array<WorkflowRegistration>;
    nextCursor: string | null;
    /**
     * Deprecated: use workflow_registrations
     */
    workflowVersions: Array<WorkflowRegistration>;
};
/** @internal */
export declare const WorkflowRegistrationListResponse$inboundSchema: z.ZodType<WorkflowRegistrationListResponse, unknown>;
export declare function workflowRegistrationListResponseFromJSON(jsonString: string): SafeParseResult<WorkflowRegistrationListResponse, SDKValidationError>;
//# sourceMappingURL=workflowregistrationlistresponse.d.ts.map