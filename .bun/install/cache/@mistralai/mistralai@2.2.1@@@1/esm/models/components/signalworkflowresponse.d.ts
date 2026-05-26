import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type SignalWorkflowResponse = {
    message: string;
};
/** @internal */
export declare const SignalWorkflowResponse$inboundSchema: z.ZodType<SignalWorkflowResponse, unknown>;
export declare function signalWorkflowResponseFromJSON(jsonString: string): SafeParseResult<SignalWorkflowResponse, SDKValidationError>;
//# sourceMappingURL=signalworkflowresponse.d.ts.map