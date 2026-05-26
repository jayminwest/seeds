import * as z from "zod/v4";
export type UnscheduleWorkflowV1WorkflowsSchedulesScheduleIdDeleteRequest = {
    scheduleId: string;
};
/** @internal */
export type UnscheduleWorkflowV1WorkflowsSchedulesScheduleIdDeleteRequest$Outbound = {
    schedule_id: string;
};
/** @internal */
export declare const UnscheduleWorkflowV1WorkflowsSchedulesScheduleIdDeleteRequest$outboundSchema: z.ZodType<UnscheduleWorkflowV1WorkflowsSchedulesScheduleIdDeleteRequest$Outbound, UnscheduleWorkflowV1WorkflowsSchedulesScheduleIdDeleteRequest>;
export declare function unscheduleWorkflowV1WorkflowsSchedulesScheduleIdDeleteRequestToJSON(unscheduleWorkflowV1WorkflowsSchedulesScheduleIdDeleteRequest: UnscheduleWorkflowV1WorkflowsSchedulesScheduleIdDeleteRequest): string;
//# sourceMappingURL=unscheduleworkflowv1workflowsschedulesscheduleiddelete.d.ts.map