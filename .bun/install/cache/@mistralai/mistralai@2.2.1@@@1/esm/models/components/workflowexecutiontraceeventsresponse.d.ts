import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowExecutionProgressTraceEvent } from "./workflowexecutionprogresstraceevent.js";
import { WorkflowExecutionStatus } from "./workflowexecutionstatus.js";
import { WorkflowExecutionTraceEvent } from "./workflowexecutiontraceevent.js";
export type WorkflowExecutionTraceEventsResponseEvent = WorkflowExecutionProgressTraceEvent | WorkflowExecutionTraceEvent;
export type WorkflowExecutionTraceEventsResponse = {
    /**
     * The name of the workflow
     */
    workflowName: string;
    /**
     * The ID of the workflow execution
     */
    executionId: string;
    /**
     * The parent execution ID of the workflow execution
     */
    parentExecutionId?: string | null | undefined;
    /**
     * The root execution ID of the workflow execution
     */
    rootExecutionId: string;
    /**
     * The unique run identifier (database UUID)
     */
    runId?: string | null | undefined;
    /**
     * The status of the workflow execution
     */
    status: WorkflowExecutionStatus | null;
    /**
     * The start time of the workflow execution
     */
    startTime: Date;
    /**
     * The end time of the workflow execution, if available
     */
    endTime: Date | null;
    /**
     * The total duration of the trace in milliseconds
     */
    totalDurationMs?: number | null | undefined;
    /**
     * The result of the workflow execution, if available
     */
    result: any | null;
    /**
     * The events of the workflow execution
     */
    events?: Array<WorkflowExecutionProgressTraceEvent | WorkflowExecutionTraceEvent> | undefined;
};
/** @internal */
export declare const WorkflowExecutionTraceEventsResponseEvent$inboundSchema: z.ZodType<WorkflowExecutionTraceEventsResponseEvent, unknown>;
export declare function workflowExecutionTraceEventsResponseEventFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionTraceEventsResponseEvent, SDKValidationError>;
/** @internal */
export declare const WorkflowExecutionTraceEventsResponse$inboundSchema: z.ZodType<WorkflowExecutionTraceEventsResponse, unknown>;
export declare function workflowExecutionTraceEventsResponseFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionTraceEventsResponse, SDKValidationError>;
//# sourceMappingURL=workflowexecutiontraceeventsresponse.d.ts.map