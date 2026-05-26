import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { WorkflowExecutionStatus } from "./workflowexecutionstatus.js";
import { WorkflowExecutionTraceSummarySpan } from "./workflowexecutiontracesummaryspan.js";
export type WorkflowExecutionTraceSummaryResponse = {
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
     * The root span of the trace
     */
    spanTree?: WorkflowExecutionTraceSummarySpan | null | undefined;
};
/** @internal */
export declare const WorkflowExecutionTraceSummaryResponse$inboundSchema: z.ZodType<WorkflowExecutionTraceSummaryResponse, unknown>;
export declare function workflowExecutionTraceSummaryResponseFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionTraceSummaryResponse, SDKValidationError>;
//# sourceMappingURL=workflowexecutiontracesummaryresponse.d.ts.map