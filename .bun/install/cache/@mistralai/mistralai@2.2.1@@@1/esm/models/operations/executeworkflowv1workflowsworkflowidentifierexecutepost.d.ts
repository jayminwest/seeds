import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePostRequest = {
    workflowIdentifier: string;
    workflowExecutionRequest: components.WorkflowExecutionRequest;
};
/**
 * Successful Response
 */
export type ResponseExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePost = components.WorkflowExecutionResponse | components.WorkflowExecutionSyncResponse;
/** @internal */
export type ExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePostRequest$Outbound = {
    workflow_identifier: string;
    WorkflowExecutionRequest: components.WorkflowExecutionRequest$Outbound;
};
/** @internal */
export declare const ExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePostRequest$outboundSchema: z.ZodType<ExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePostRequest$Outbound, ExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePostRequest>;
export declare function executeWorkflowV1WorkflowsWorkflowIdentifierExecutePostRequestToJSON(executeWorkflowV1WorkflowsWorkflowIdentifierExecutePostRequest: ExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePostRequest): string;
/** @internal */
export declare const ResponseExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePost$inboundSchema: z.ZodType<ResponseExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePost, unknown>;
export declare function responseExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePostFromJSON(jsonString: string): SafeParseResult<ResponseExecuteWorkflowV1WorkflowsWorkflowIdentifierExecutePost, SDKValidationError>;
//# sourceMappingURL=executeworkflowv1workflowsworkflowidentifierexecutepost.d.ts.map