import * as z from "zod/v4";
export type GetWorkflowRegistrationsV1WorkflowsRegistrationsGetRequest = {
    /**
     * The workflow ID to filter by
     */
    workflowId?: string | null | undefined;
    /**
     * The task queue to filter by
     */
    taskQueue?: string | null | undefined;
    /**
     * Whether to only return active workflows versions
     */
    activeOnly?: boolean | undefined;
    /**
     * Whether to include shared workflow versions
     */
    includeShared?: boolean | undefined;
    /**
     * The workflow name to filter by
     */
    workflowSearch?: string | null | undefined;
    /**
     * Filter by archived state. False=exclude archived, True=only archived, None=include all
     */
    archived?: boolean | null | undefined;
    /**
     * Whether to include the workflow definition
     */
    withWorkflow?: boolean | undefined;
    /**
     * Whether to only return workflows available in chat assistant
     */
    availableInChatAssistant?: boolean | null | undefined;
    /**
     * The maximum number of workflows versions to return
     */
    limit?: number | undefined;
    /**
     * The cursor for pagination
     */
    cursor?: string | null | undefined;
};
/** @internal */
export type GetWorkflowRegistrationsV1WorkflowsRegistrationsGetRequest$Outbound = {
    workflow_id?: string | null | undefined;
    task_queue?: string | null | undefined;
    active_only: boolean;
    include_shared: boolean;
    workflow_search?: string | null | undefined;
    archived?: boolean | null | undefined;
    with_workflow: boolean;
    available_in_chat_assistant?: boolean | null | undefined;
    limit: number;
    cursor?: string | null | undefined;
};
/** @internal */
export declare const GetWorkflowRegistrationsV1WorkflowsRegistrationsGetRequest$outboundSchema: z.ZodType<GetWorkflowRegistrationsV1WorkflowsRegistrationsGetRequest$Outbound, GetWorkflowRegistrationsV1WorkflowsRegistrationsGetRequest>;
export declare function getWorkflowRegistrationsV1WorkflowsRegistrationsGetRequestToJSON(getWorkflowRegistrationsV1WorkflowsRegistrationsGetRequest: GetWorkflowRegistrationsV1WorkflowsRegistrationsGetRequest): string;
//# sourceMappingURL=getworkflowregistrationsv1workflowsregistrationsget.d.ts.map