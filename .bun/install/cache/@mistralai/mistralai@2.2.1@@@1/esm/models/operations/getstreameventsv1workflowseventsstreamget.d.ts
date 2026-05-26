import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import * as components from "../components/index.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export declare const Scope: {
    readonly Activity: "activity";
    readonly Workflow: "workflow";
    readonly Wildcard: "*";
};
export type Scope = ClosedEnum<typeof Scope>;
export type GetStreamEventsV1WorkflowsEventsStreamGetRequest = {
    scope?: Scope | undefined;
    activityName?: string | undefined;
    activityId?: string | undefined;
    workflowName?: string | undefined;
    workflowExecId?: string | undefined;
    rootWorkflowExecId?: string | undefined;
    parentWorkflowExecId?: string | undefined;
    stream?: string | undefined;
    startSeq?: number | undefined;
    metadataFilters?: {
        [k: string]: any;
    } | null | undefined;
    workflowEventTypes?: Array<components.WorkflowEventType> | null | undefined;
    lastEventId?: string | null | undefined;
};
/**
 * Stream of Server-Sent Events (SSE)
 */
export type GetStreamEventsV1WorkflowsEventsStreamGetResponseBody = {
    event?: string | undefined;
    data?: components.StreamEventSsePayload | undefined;
    id?: string | undefined;
    retry?: number | undefined;
};
/** @internal */
export declare const Scope$outboundSchema: z.ZodEnum<typeof Scope>;
/** @internal */
export type GetStreamEventsV1WorkflowsEventsStreamGetRequest$Outbound = {
    scope: string;
    activity_name: string;
    activity_id: string;
    workflow_name: string;
    workflow_exec_id: string;
    root_workflow_exec_id: string;
    parent_workflow_exec_id: string;
    stream: string;
    start_seq: number;
    metadata_filters?: {
        [k: string]: any;
    } | null | undefined;
    workflow_event_types?: Array<string> | null | undefined;
    "last-event-id"?: string | null | undefined;
};
/** @internal */
export declare const GetStreamEventsV1WorkflowsEventsStreamGetRequest$outboundSchema: z.ZodType<GetStreamEventsV1WorkflowsEventsStreamGetRequest$Outbound, GetStreamEventsV1WorkflowsEventsStreamGetRequest>;
export declare function getStreamEventsV1WorkflowsEventsStreamGetRequestToJSON(getStreamEventsV1WorkflowsEventsStreamGetRequest: GetStreamEventsV1WorkflowsEventsStreamGetRequest): string;
/** @internal */
export declare const GetStreamEventsV1WorkflowsEventsStreamGetResponseBody$inboundSchema: z.ZodType<GetStreamEventsV1WorkflowsEventsStreamGetResponseBody, unknown>;
export declare function getStreamEventsV1WorkflowsEventsStreamGetResponseBodyFromJSON(jsonString: string): SafeParseResult<GetStreamEventsV1WorkflowsEventsStreamGetResponseBody, SDKValidationError>;
//# sourceMappingURL=getstreameventsv1workflowseventsstreamget.d.ts.map