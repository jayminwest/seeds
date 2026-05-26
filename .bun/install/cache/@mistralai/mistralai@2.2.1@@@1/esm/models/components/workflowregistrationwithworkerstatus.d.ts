import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Workflow } from "./workflow.js";
import { WorkflowCodeDefinition } from "./workflowcodedefinition.js";
export type WorkflowRegistrationWithWorkerStatus = {
    /**
     * Unique identifier of the workflow registration
     */
    id: string;
    /**
     * Deployment ID this registration belongs to
     */
    deploymentId?: string | null | undefined;
    /**
     * Deprecated. Use deployment_id instead. Will be removed in a future release.
     *
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    taskQueue?: string | null | undefined;
    definition: WorkflowCodeDefinition;
    /**
     * Workflow ID of the workflow
     */
    workflowId: string;
    /**
     * Workflow of the workflow registration
     */
    workflow?: Workflow | null | undefined;
    /**
     * Whether the workflow is compatible with chat assistant
     */
    compatibleWithChatAssistant: boolean;
    /**
     * Whether the workflow registration is active
     */
    active: boolean;
};
/** @internal */
export declare const WorkflowRegistrationWithWorkerStatus$inboundSchema: z.ZodType<WorkflowRegistrationWithWorkerStatus, unknown>;
export declare function workflowRegistrationWithWorkerStatusFromJSON(jsonString: string): SafeParseResult<WorkflowRegistrationWithWorkerStatus, SDKValidationError>;
//# sourceMappingURL=workflowregistrationwithworkerstatus.d.ts.map