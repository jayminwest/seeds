import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Workflow } from "./workflow.js";
import { WorkflowCodeDefinition } from "./workflowcodedefinition.js";
export type WorkflowRegistration = {
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
};
/** @internal */
export declare const WorkflowRegistration$inboundSchema: z.ZodType<WorkflowRegistration, unknown>;
export declare function workflowRegistrationFromJSON(jsonString: string): SafeParseResult<WorkflowRegistration, SDKValidationError>;
//# sourceMappingURL=workflowregistration.d.ts.map