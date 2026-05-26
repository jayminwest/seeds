import * as z from "zod/v4";
export type GetWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdGetRequest = {
    workflowRegistrationId: string;
    /**
     * Whether to include the workflow definition
     */
    withWorkflow?: boolean | undefined;
    /**
     * Whether to include shared workflow versions
     */
    includeShared?: boolean | undefined;
};
/** @internal */
export type GetWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdGetRequest$Outbound = {
    workflow_registration_id: string;
    with_workflow: boolean;
    include_shared: boolean;
};
/** @internal */
export declare const GetWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdGetRequest$outboundSchema: z.ZodType<GetWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdGetRequest$Outbound, GetWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdGetRequest>;
export declare function getWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdGetRequestToJSON(getWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdGetRequest: GetWorkflowRegistrationV1WorkflowsRegistrationsWorkflowRegistrationIdGetRequest): string;
//# sourceMappingURL=getworkflowregistrationv1workflowsregistrationsworkflowregistrationidget.d.ts.map