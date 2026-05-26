import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowExecutionTraceEvent } from "./workflowexecutiontraceevent.js";
import { WorkflowExecutionTraceSummaryAttributesValues } from "./workflowexecutiontracesummaryattributesvalues.js";
export type WorkflowExecutionTraceSummarySpan = {
    /**
     * The ID of the span
     */
    spanId: string;
    /**
     * The name of the span
     */
    name: string;
    /**
     * The start time of the span in nanoseconds since the Unix epoch
     */
    startTimeUnixNano: number;
    /**
     * The end time of the span in nanoseconds since the Unix epoch
     */
    endTimeUnixNano: number | null;
    /**
     * The attributes of the span
     */
    attributes: {
        [k: string]: WorkflowExecutionTraceSummaryAttributesValues | null;
    };
    /**
     * The events of the span
     */
    events: Array<WorkflowExecutionTraceEvent>;
    /**
     * The child spans of the span
     */
    children?: Array<WorkflowExecutionTraceSummarySpan> | undefined;
};
/** @internal */
export declare const WorkflowExecutionTraceSummarySpan$inboundSchema: z.ZodType<WorkflowExecutionTraceSummarySpan, unknown>;
export declare function workflowExecutionTraceSummarySpanFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionTraceSummarySpan, SDKValidationError>;
//# sourceMappingURL=workflowexecutiontracesummaryspan.d.ts.map