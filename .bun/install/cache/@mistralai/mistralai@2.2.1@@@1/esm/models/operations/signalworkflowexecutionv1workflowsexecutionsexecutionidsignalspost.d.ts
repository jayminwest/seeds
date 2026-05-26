import * as z from "zod/v4";
import * as components from "../components/index.js";
export type SignalWorkflowExecutionV1WorkflowsExecutionsExecutionIdSignalsPostRequest = {
    executionId: string;
    signalInvocationBody: components.SignalInvocationBody;
};
/** @internal */
export type SignalWorkflowExecutionV1WorkflowsExecutionsExecutionIdSignalsPostRequest$Outbound = {
    execution_id: string;
    SignalInvocationBody: components.SignalInvocationBody$Outbound;
};
/** @internal */
export declare const SignalWorkflowExecutionV1WorkflowsExecutionsExecutionIdSignalsPostRequest$outboundSchema: z.ZodType<SignalWorkflowExecutionV1WorkflowsExecutionsExecutionIdSignalsPostRequest$Outbound, SignalWorkflowExecutionV1WorkflowsExecutionsExecutionIdSignalsPostRequest>;
export declare function signalWorkflowExecutionV1WorkflowsExecutionsExecutionIdSignalsPostRequestToJSON(signalWorkflowExecutionV1WorkflowsExecutionsExecutionIdSignalsPostRequest: SignalWorkflowExecutionV1WorkflowsExecutionsExecutionIdSignalsPostRequest): string;
//# sourceMappingURL=signalworkflowexecutionv1workflowsexecutionsexecutionidsignalspost.d.ts.map