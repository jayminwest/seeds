import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Schedules extends ClientSDK {
    /**
     * Get Schedules
     */
    getSchedules(options?: RequestOptions): Promise<components.WorkflowScheduleListResponse>;
    /**
     * Schedule Workflow
     */
    scheduleWorkflow(request: components.WorkflowScheduleRequest, options?: RequestOptions): Promise<components.WorkflowScheduleResponse>;
    /**
     * Unschedule Workflow
     */
    unscheduleWorkflow(request: operations.UnscheduleWorkflowV1WorkflowsSchedulesScheduleIdDeleteRequest, options?: RequestOptions): Promise<void>;
}
//# sourceMappingURL=schedules.d.ts.map