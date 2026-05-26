import * as z from "zod/v4";
export type WorkflowUpdateRequest = {
    /**
     * New display name value
     */
    displayName?: string | null | undefined;
    /**
     * New description value
     */
    description?: string | null | undefined;
    /**
     * Whether to make the workflow available in the chat assistant
     */
    availableInChatAssistant?: boolean | null | undefined;
};
/** @internal */
export type WorkflowUpdateRequest$Outbound = {
    display_name?: string | null | undefined;
    description?: string | null | undefined;
    available_in_chat_assistant?: boolean | null | undefined;
};
/** @internal */
export declare const WorkflowUpdateRequest$outboundSchema: z.ZodType<WorkflowUpdateRequest$Outbound, WorkflowUpdateRequest>;
export declare function workflowUpdateRequestToJSON(workflowUpdateRequest: WorkflowUpdateRequest): string;
//# sourceMappingURL=workflowupdaterequest.d.ts.map