import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ConversationUsageInfo } from "./conversationusageinfo.js";
export type ResponseDoneEvent = {
    type: "conversation.response.done";
    createdAt?: Date | undefined;
    usage: ConversationUsageInfo;
};
/** @internal */
export declare const ResponseDoneEvent$inboundSchema: z.ZodType<ResponseDoneEvent, unknown>;
export declare function responseDoneEventFromJSON(jsonString: string): SafeParseResult<ResponseDoneEvent, SDKValidationError>;
//# sourceMappingURL=responsedoneevent.d.ts.map