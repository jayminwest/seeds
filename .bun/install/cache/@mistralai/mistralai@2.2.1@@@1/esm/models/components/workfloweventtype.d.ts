import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const WorkflowEventType: {
    readonly WorkflowExecutionStarted: "WORKFLOW_EXECUTION_STARTED";
    readonly WorkflowExecutionCompleted: "WORKFLOW_EXECUTION_COMPLETED";
    readonly WorkflowExecutionFailed: "WORKFLOW_EXECUTION_FAILED";
    readonly WorkflowExecutionCanceled: "WORKFLOW_EXECUTION_CANCELED";
    readonly WorkflowExecutionContinuedAsNew: "WORKFLOW_EXECUTION_CONTINUED_AS_NEW";
    readonly WorkflowTaskTimedOut: "WORKFLOW_TASK_TIMED_OUT";
    readonly WorkflowTaskFailed: "WORKFLOW_TASK_FAILED";
    readonly CustomTaskStarted: "CUSTOM_TASK_STARTED";
    readonly CustomTaskInProgress: "CUSTOM_TASK_IN_PROGRESS";
    readonly CustomTaskCompleted: "CUSTOM_TASK_COMPLETED";
    readonly CustomTaskFailed: "CUSTOM_TASK_FAILED";
    readonly CustomTaskTimedOut: "CUSTOM_TASK_TIMED_OUT";
    readonly CustomTaskCanceled: "CUSTOM_TASK_CANCELED";
    readonly ActivityTaskStarted: "ACTIVITY_TASK_STARTED";
    readonly ActivityTaskCompleted: "ACTIVITY_TASK_COMPLETED";
    readonly ActivityTaskRetrying: "ACTIVITY_TASK_RETRYING";
    readonly ActivityTaskFailed: "ACTIVITY_TASK_FAILED";
};
export type WorkflowEventType = ClosedEnum<typeof WorkflowEventType>;
/** @internal */
export declare const WorkflowEventType$outboundSchema: z.ZodEnum<typeof WorkflowEventType>;
//# sourceMappingURL=workfloweventtype.d.ts.map