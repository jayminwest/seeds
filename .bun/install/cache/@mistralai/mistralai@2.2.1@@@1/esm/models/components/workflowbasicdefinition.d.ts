import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowMetadata } from "./workflowmetadata.js";
export type WorkflowBasicDefinition = {
    id: string;
    /**
     * The name of the workflow
     */
    name: string;
    /**
     * The display name of the workflow
     */
    displayName: string;
    /**
     * A description of the workflow
     */
    description?: string | null | undefined;
    metadata?: WorkflowMetadata | undefined;
    /**
     * Whether the workflow is archived
     */
    archived: boolean;
};
/** @internal */
export declare const WorkflowBasicDefinition$inboundSchema: z.ZodType<WorkflowBasicDefinition, unknown>;
export declare function workflowBasicDefinitionFromJSON(jsonString: string): SafeParseResult<WorkflowBasicDefinition, SDKValidationError>;
//# sourceMappingURL=workflowbasicdefinition.d.ts.map