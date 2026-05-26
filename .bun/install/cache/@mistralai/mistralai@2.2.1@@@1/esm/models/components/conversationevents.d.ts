import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { AgentHandoffDoneEvent } from "./agenthandoffdoneevent.js";
import { AgentHandoffStartedEvent } from "./agenthandoffstartedevent.js";
import { FunctionCallEvent } from "./functioncallevent.js";
import { MessageOutputEvent } from "./messageoutputevent.js";
import { ResponseDoneEvent } from "./responsedoneevent.js";
import { ResponseErrorEvent } from "./responseerrorevent.js";
import { ResponseStartedEvent } from "./responsestartedevent.js";
import { SSETypes } from "./ssetypes.js";
import { ToolExecutionDeltaEvent } from "./toolexecutiondeltaevent.js";
import { ToolExecutionDoneEvent } from "./toolexecutiondoneevent.js";
import { ToolExecutionStartedEvent } from "./toolexecutionstartedevent.js";
export type ConversationEventsData = AgentHandoffDoneEvent | AgentHandoffStartedEvent | ResponseDoneEvent | ResponseErrorEvent | ResponseStartedEvent | FunctionCallEvent | MessageOutputEvent | ToolExecutionDeltaEvent | ToolExecutionDoneEvent | ToolExecutionStartedEvent | discriminatedUnionTypes.Unknown<"type">;
export type ConversationEvents = {
    /**
     * Server side events sent when streaming a conversation response.
     */
    event: SSETypes;
    data: AgentHandoffDoneEvent | AgentHandoffStartedEvent | ResponseDoneEvent | ResponseErrorEvent | ResponseStartedEvent | FunctionCallEvent | MessageOutputEvent | ToolExecutionDeltaEvent | ToolExecutionDoneEvent | ToolExecutionStartedEvent | discriminatedUnionTypes.Unknown<"type">;
};
/** @internal */
export declare const ConversationEventsData$inboundSchema: z.ZodType<ConversationEventsData, unknown>;
export declare function conversationEventsDataFromJSON(jsonString: string): SafeParseResult<ConversationEventsData, SDKValidationError>;
/** @internal */
export declare const ConversationEvents$inboundSchema: z.ZodType<ConversationEvents, unknown>;
export declare function conversationEventsFromJSON(jsonString: string): SafeParseResult<ConversationEvents, SDKValidationError>;
//# sourceMappingURL=conversationevents.d.ts.map