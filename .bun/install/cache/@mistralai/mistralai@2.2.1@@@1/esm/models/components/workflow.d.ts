import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowType } from "./workflowtype.js";
export type Workflow = {
    /**
     * Unique identifier of the workflow
     */
    id: string;
    /**
     * Name of the workflow
     */
    name: string;
    /**
     * Display name of the workflow
     */
    displayName: string;
    type: WorkflowType;
    /**
     * Description of the workflow
     */
    description?: string | null | undefined;
    /**
     * Customer ID of the workflow
     */
    customerId: string;
    /**
     * Workspace ID of the workflow
     */
    workspaceId: string;
    /**
     * Reserved namespace for shared workflows (e.g., 'shared:my-shared-workflow')
     */
    sharedNamespace?: string | null | undefined;
    /**
     * Whether the workflow is available in chat assistant
     */
    availableInChatAssistant: boolean;
    /**
     * Whether the workflow is technical (e.g. SDK-managed)
     */
    isTechnical: boolean;
    /**
     * Whether the workflow must run associated to a user's identity
     */
    onBehalfOf: boolean;
    /**
     * Whether the workflow is archived
     */
    archived: boolean;
};
/** @internal */
export declare const Workflow$inboundSchema: z.ZodType<Workflow, unknown>;
export declare function workflowFromJSON(jsonString: string): SafeParseResult<Workflow, SDKValidationError>;
//# sourceMappingURL=workflow.d.ts.map