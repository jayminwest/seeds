import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type WorkflowMetadata = {
    /**
     * Namespace for shared workflows, None if user-owned
     */
    sharedNamespace?: string | null | undefined;
};
/** @internal */
export declare const WorkflowMetadata$inboundSchema: z.ZodType<WorkflowMetadata, unknown>;
export declare function workflowMetadataFromJSON(jsonString: string): SafeParseResult<WorkflowMetadata, SDKValidationError>;
//# sourceMappingURL=workflowmetadata.d.ts.map