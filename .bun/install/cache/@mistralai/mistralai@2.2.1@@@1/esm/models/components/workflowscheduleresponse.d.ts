import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type WorkflowScheduleResponse = {
    /**
     * The ID of the schedule
     */
    scheduleId: string;
};
/** @internal */
export declare const WorkflowScheduleResponse$inboundSchema: z.ZodType<WorkflowScheduleResponse, unknown>;
export declare function workflowScheduleResponseFromJSON(jsonString: string): SafeParseResult<WorkflowScheduleResponse, SDKValidationError>;
//# sourceMappingURL=workflowscheduleresponse.d.ts.map