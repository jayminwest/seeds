import { EventStream } from "../lib/event-streams.js";
import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class WorkflowsEvents extends ClientSDK {
    /**
     * Get Stream Events
     */
    getStreamEvents(request?: operations.GetStreamEventsV1WorkflowsEventsStreamGetRequest | undefined, options?: RequestOptions): Promise<EventStream<operations.GetStreamEventsV1WorkflowsEventsStreamGetResponseBody>>;
    /**
     * Get Workflow Events
     */
    getWorkflowEvents(request?: operations.GetWorkflowEventsV1WorkflowsEventsListGetRequest | undefined, options?: RequestOptions): Promise<components.ListWorkflowEventResponse>;
}
//# sourceMappingURL=workflowsevents.d.ts.map