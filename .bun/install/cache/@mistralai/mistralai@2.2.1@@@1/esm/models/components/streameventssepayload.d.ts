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
import { StreamEventWorkflowContext } from "./streameventworkflowcontext.js";
import { WorkflowExecutionCanceledResponse } from "./workflowexecutioncanceledresponse.js";
import { WorkflowExecutionCompletedResponse } from "./workflowexecutioncompletedresponse.js";
import { WorkflowExecutionContinuedAsNewResponse } from "./workflowexecutioncontinuedasnewresponse.js";
import { WorkflowExecutionFailedResponse } from "./workflowexecutionfailedresponse.js";
import { WorkflowExecutionStartedResponse } from "./workflowexecutionstartedresponse.js";
import { WorkflowTaskFailedResponse } from "./workflowtaskfailedresponse.js";
import { WorkflowTaskTimedOutResponse } from "./workflowtasktimedoutresponse.js";
export type StreamEventSsePayloadData = WorkflowExecutionStartedResponse | WorkflowExecutionCompletedResponse | WorkflowExecutionFailedResponse | WorkflowExecutionCanceledResponse | WorkflowExecutionContinuedAsNewResponse | WorkflowTaskTimedOutResponse | WorkflowTaskFailedResponse | CustomTaskStartedResponse | CustomTaskInProgressResponse | CustomTaskCompletedResponse | CustomTaskFailedResponse | CustomTaskTimedOutResponse | CustomTaskCanceledResponse | ActivityTaskStartedResponse | ActivityTaskCompletedResponse | ActivityTaskRetryingResponse | ActivityTaskFailedResponse;
export type StreamEventSsePayload = {
    stream: string;
    timestamp?: Date | undefined;
    data: WorkflowExecutionStartedResponse | WorkflowExecutionCompletedResponse | WorkflowExecutionFailedResponse | WorkflowExecutionCanceledResponse | WorkflowExecutionContinuedAsNewResponse | WorkflowTaskTimedOutResponse | WorkflowTaskFailedResponse | CustomTaskStartedResponse | CustomTaskInProgressResponse | CustomTaskCompletedResponse | CustomTaskFailedResponse | CustomTaskTimedOutResponse | CustomTaskCanceledResponse | ActivityTaskStartedResponse | ActivityTaskCompletedResponse | ActivityTaskRetryingResponse | ActivityTaskFailedResponse;
    workflowContext: StreamEventWorkflowContext;
    metadata?: {
        [k: string]: any;
    } | undefined;
    brokerSequence: number;
};
/** @internal */
export declare const StreamEventSsePayloadData$inboundSchema: z.ZodType<StreamEventSsePayloadData, unknown>;
export declare function streamEventSsePayloadDataFromJSON(jsonString: string): SafeParseResult<StreamEventSsePayloadData, SDKValidationError>;
/** @internal */
export declare const StreamEventSsePayload$inboundSchema: z.ZodType<StreamEventSsePayload, unknown>;
export declare function streamEventSsePayloadFromJSON(jsonString: string): SafeParseResult<StreamEventSsePayload, SDKValidationError>;
//# sourceMappingURL=streameventssepayload.d.ts.map