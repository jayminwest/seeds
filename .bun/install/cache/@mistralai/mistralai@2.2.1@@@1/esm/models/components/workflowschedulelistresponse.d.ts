import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ScheduleDefinitionOutput } from "./scheduledefinitionoutput.js";
export type WorkflowScheduleListResponse = {
    /**
     * A list of workflow schedules
     */
    schedules: Array<ScheduleDefinitionOutput>;
};
/** @internal */
export declare const WorkflowScheduleListResponse$inboundSchema: z.ZodType<WorkflowScheduleListResponse, unknown>;
export declare function workflowScheduleListResponseFromJSON(jsonString: string): SafeParseResult<WorkflowScheduleListResponse, SDKValidationError>;
//# sourceMappingURL=workflowschedulelistresponse.d.ts.map