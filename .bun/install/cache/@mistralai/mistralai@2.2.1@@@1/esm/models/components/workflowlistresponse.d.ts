import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowBasicDefinition } from "./workflowbasicdefinition.js";
export type WorkflowListResponse = {
    /**
     * A list of workflows
     */
    workflows: Array<WorkflowBasicDefinition>;
    nextCursor: string | null;
};
/** @internal */
export declare const WorkflowListResponse$inboundSchema: z.ZodType<WorkflowListResponse, unknown>;
export declare function workflowListResponseFromJSON(jsonString: string): SafeParseResult<WorkflowListResponse, SDKValidationError>;
//# sourceMappingURL=workflowlistresponse.d.ts.map