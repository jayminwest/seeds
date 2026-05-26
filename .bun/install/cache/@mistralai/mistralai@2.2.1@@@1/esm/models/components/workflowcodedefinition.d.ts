import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { QueryDefinition } from "./querydefinition.js";
import { SignalDefinition } from "./signaldefinition.js";
import { UpdateDefinition } from "./updatedefinition.js";
export type WorkflowCodeDefinition = {
    /**
     * Input schema of the workflow's run method
     */
    inputSchema: {
        [k: string]: any;
    };
    /**
     * Output schema of the workflow's run method
     */
    outputSchema?: {
        [k: string]: any;
    } | null | undefined;
    /**
     * Signal handlers defined by the workflow
     */
    signals?: Array<SignalDefinition> | undefined;
    /**
     * Query handlers defined by the workflow
     */
    queries?: Array<QueryDefinition> | undefined;
    /**
     * Update handlers defined by the workflow
     */
    updates?: Array<UpdateDefinition> | undefined;
    /**
     * Whether the workflow enforces deterministic execution
     */
    enforceDeterminism: boolean;
    /**
     * Maximum total execution time including retries and continue-as-new
     */
    executionTimeout?: number | undefined;
    /**
     * Plugin-specific metadata (e.g. connector declarations)
     */
    pluginMetadata?: {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export declare const WorkflowCodeDefinition$inboundSchema: z.ZodType<WorkflowCodeDefinition, unknown>;
export declare function workflowCodeDefinitionFromJSON(jsonString: string): SafeParseResult<WorkflowCodeDefinition, SDKValidationError>;
//# sourceMappingURL=workflowcodedefinition.d.ts.map