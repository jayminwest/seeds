import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type StreamEventWorkflowContext = {
    namespace: string;
    workflowName: string;
    workflowExecId: string;
    parentWorkflowExecId?: string | null | undefined;
    rootWorkflowExecId?: string | null | undefined;
};
/** @internal */
export declare const StreamEventWorkflowContext$inboundSchema: z.ZodType<StreamEventWorkflowContext, unknown>;
export declare function streamEventWorkflowContextFromJSON(jsonString: string): SafeParseResult<StreamEventWorkflowContext, SDKValidationError>;
//# sourceMappingURL=streameventworkflowcontext.d.ts.map