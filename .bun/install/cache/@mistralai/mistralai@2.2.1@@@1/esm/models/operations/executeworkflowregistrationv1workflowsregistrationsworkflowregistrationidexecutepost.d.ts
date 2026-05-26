import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePostRequest = {
    workflowRegistrationId: string;
    workflowExecutionRequest: components.WorkflowExecutionRequest;
};
/**
 * Successful Response
 */
export type ResponseExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePost = components.WorkflowExecutionResponse | components.WorkflowExecutionSyncResponse;
/** @internal */
export type ExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePostRequest$Outbound = {
    workflow_registration_id: string;
    WorkflowExecutionRequest: components.WorkflowExecutionRequest$Outbound;
};
/** @internal */
export declare const ExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePostRequest$outboundSchema: z.ZodType<ExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePostRequest$Outbound, ExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePostRequest>;
export declare function executeWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePostRequestToJSON(executeWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePostRequest: ExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePostRequest): string;
/** @internal */
export declare const ResponseExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePost$inboundSchema: z.ZodType<ResponseExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePost, unknown>;
export declare function responseExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePostFromJSON(jsonString: string): SafeParseResult<ResponseExecuteWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdExecutePost, SDKValidationError>;
//# sourceMappingURL=executeworkflowregistrationv1workflowsregistrationsworkflowregistrationidexecutepost.d.ts.map