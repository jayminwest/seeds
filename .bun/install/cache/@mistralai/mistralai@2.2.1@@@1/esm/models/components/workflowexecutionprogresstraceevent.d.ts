import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { EventProgressStatus } from "./eventprogressstatus.js";
import { EventType } from "./eventtype.js";
import { WorkflowExecutionTraceSummaryAttributesValues } from "./workflowexecutiontracesummaryattributesvalues.js";
export type WorkflowExecutionProgressTraceEvent = {
    type?: EventType | undefined;
    /**
     * Name of the event
     */
    name: string;
    /**
     * The ID of the event
     */
    id: string;
    /**
     * The timestamp of the event in nanoseconds since the Unix epoch
     */
    timestampUnixNano: number;
    /**
     * The attributes of the event
     */
    attributes: {
        [k: string]: WorkflowExecutionTraceSummaryAttributesValues | null;
    };
    /**
     * Whether the event is internal
     */
    internal: boolean;
    status?: EventProgressStatus | undefined;
    /**
     * The start time of the event in milliseconds since the Unix epoch
     */
    startTimeUnixMs: number;
    /**
     * The end time of the event in milliseconds since the Unix epoch
     */
    endTimeUnixMs?: number | null | undefined;
    /**
     * The error message, if any
     */
    error?: string | null | undefined;
};
/** @internal */
export declare const WorkflowExecutionProgressTraceEvent$inboundSchema: z.ZodType<WorkflowExecutionProgressTraceEvent, unknown>;
export declare function workflowExecutionProgressTraceEventFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionProgressTraceEvent, SDKValidationError>;
//# sourceMappingURL=workflowexecutionprogresstraceevent.d.ts.map