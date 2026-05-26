import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { EventType } from "./eventtype.js";
import { WorkflowExecutionTraceSummaryAttributesValues } from "./workflowexecutiontracesummaryattributesvalues.js";
export type WorkflowExecutionTraceEvent = {
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
};
/** @internal */
export declare const WorkflowExecutionTraceEvent$inboundSchema: z.ZodType<WorkflowExecutionTraceEvent, unknown>;
export declare function workflowExecutionTraceEventFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionTraceEvent, SDKValidationError>;
//# sourceMappingURL=workflowexecutiontraceevent.d.ts.map