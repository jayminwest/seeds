import * as z from "zod/v4";
import { ScheduleDefinition, ScheduleDefinition$Outbound } from "./scheduledefinition.js";
export type WorkflowScheduleRequest = {
    /**
     * Specification of the times scheduled actions may occur.
     *
     * @remarks
     *
     * The times are the union of :py:attr:`calendars`, :py:attr:`intervals`, and
     * :py:attr:`cron_expressions` excluding anything in :py:attr:`skip`.
     *
     * Used for input where schedule_id is optional (can be provided or auto-generated).
     */
    schedule: ScheduleDefinition;
    /**
     * The ID of the workflow registration to schedule
     */
    workflowRegistrationId?: string | null | undefined;
    /**
     * Deprecated: use workflow_registration_id
     */
    workflowVersionId?: string | null | undefined;
    /**
     * The name or ID of the workflow to schedule
     */
    workflowIdentifier?: string | null | undefined;
    /**
     * Deprecated. Use deployment_name instead.
     *
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    workflowTaskQueue?: string | null | undefined;
    /**
     * Allows you to specify a custom schedule ID. If not provided, a random ID will be generated.
     */
    scheduleId?: string | null | undefined;
    /**
     * Name of the deployment to route this schedule to
     */
    deploymentName?: string | null | undefined;
};
/** @internal */
export type WorkflowScheduleRequest$Outbound = {
    schedule: ScheduleDefinition$Outbound;
    workflow_registration_id?: string | null | undefined;
    workflow_version_id?: string | null | undefined;
    workflow_identifier?: string | null | undefined;
    workflow_task_queue?: string | null | undefined;
    schedule_id?: string | null | undefined;
    deployment_name?: string | null | undefined;
};
/** @internal */
export declare const WorkflowScheduleRequest$outboundSchema: z.ZodType<WorkflowScheduleRequest$Outbound, WorkflowScheduleRequest>;
export declare function workflowScheduleRequestToJSON(workflowScheduleRequest: WorkflowScheduleRequest): string;
//# sourceMappingURL=workflowschedulerequest.d.ts.map