import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ActivityTaskCompletedResponse } from "./activitytaskcompletedresponse.js";
import { ActivityTaskFailedResponse } from "./activitytaskfailedresponse.js";
import { ActivityTaskRetryingResponse } from "./activitytaskretryingresponse.js";
import { ActivityTaskStartedResponse } from "./activitytaskstartedresponse.js";
import { CustomTaskCanceledResponse } from "./customtaskcanceledresponse.js";
import { CustomTaskCompletedResponse } from "./customtaskcompletedresponse.js";
import { CustomTaskFailedResponse } from "./customtaskfailedresponse.js";
import { CustomTaskInProgressResponse } from "./customtaskinprogressresponse.js";
import { CustomTaskStartedResponse } from "./customtaskstartedresponse.js";
import { CustomTaskTimedOutResponse } from "./customtasktimedoutresponse.js";
import { WorkflowExecutionCanceledResponse } from "./workflowexecutioncanceledresponse.js";
import { WorkflowExecutionCompletedResponse } from "./workflowexecutioncompletedresponse.js";
import { WorkflowExecutionContinuedAsNewResponse } from "./workflowexecutioncontinuedasnewresponse.js";
import { WorkflowExecutionFailedResponse } from "./workflowexecutionfailedresponse.js";
import { WorkflowExecutionStartedResponse } from "./workflowexecutionstartedresponse.js";
import { WorkflowTaskFailedResponse } from "./workflowtaskfailedresponse.js";
import { WorkflowTaskTimedOutResponse } from "./workflowtasktimedoutresponse.js";
export type ListWorkflowEventResponseEvent = WorkflowExecutionStartedResponse | WorkflowExecutionCompletedResponse | WorkflowExecutionFailedResponse | WorkflowExecutionCanceledResponse | WorkflowExecutionContinuedAsNewResponse | WorkflowTaskTimedOutResponse | WorkflowTaskFailedResponse | CustomTaskStartedResponse | CustomTaskInProgressResponse | CustomTaskCompletedResponse | CustomTaskFailedResponse | CustomTaskTimedOutResponse | CustomTaskCanceledResponse | ActivityTaskStartedResponse | ActivityTaskCompletedResponse | ActivityTaskRetryingResponse | ActivityTaskFailedResponse;
export type ListWorkflowEventResponse = {
    /**
     * List of workflow events.
     */
    events: Array<WorkflowExecutionStartedResponse | WorkflowExecutionCompletedResponse | WorkflowExecutionFailedResponse | WorkflowExecutionCanceledResponse | WorkflowExecutionContinuedAsNewResponse | WorkflowTaskTimedOutResponse | WorkflowTaskFailedResponse | CustomTaskStartedResponse | CustomTaskInProgressResponse | CustomTaskCompletedResponse | CustomTaskFailedResponse | CustomTaskTimedOutResponse | CustomTaskCanceledResponse | ActivityTaskStartedResponse | ActivityTaskCompletedResponse | ActivityTaskRetryingResponse | ActivityTaskFailedResponse>;
    /**
     * Cursor for pagination.
     */
    nextCursor?: string | null | undefined;
};
/** @internal */
export declare const ListWorkflowEventResponseEvent$inboundSchema: z.ZodType<ListWorkflowEventResponseEvent, unknown>;
export declare function listWorkflowEventResponseEventFromJSON(jsonString: string): SafeParseResult<ListWorkflowEventResponseEvent, SDKValidationError>;
/** @internal */
export declare const ListWorkflowEventResponse$inboundSchema: z.ZodType<ListWorkflowEventResponse, unknown>;
export declare function listWorkflowEventResponseFromJSON(jsonString: string): SafeParseResult<ListWorkflowEventResponse, SDKValidationError>;
//# sourceMappingURL=listworkfloweventresponse.d.ts.map