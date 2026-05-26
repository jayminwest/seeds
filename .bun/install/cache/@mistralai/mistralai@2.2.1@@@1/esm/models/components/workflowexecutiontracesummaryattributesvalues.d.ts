import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type WorkflowExecutionTraceSummaryAttributesValues = string | number | number | boolean | Array<any>;
/** @internal */
export declare const WorkflowExecutionTraceSummaryAttributesValues$inboundSchema: z.ZodType<WorkflowExecutionTraceSummaryAttributesValues, unknown>;
export declare function workflowExecutionTraceSummaryAttributesValuesFromJSON(jsonString: string): SafeParseResult<WorkflowExecutionTraceSummaryAttributesValues, SDKValidationError>;
//# sourceMappingURL=workflowexecutiontracesummaryattributesvalues.d.ts.map