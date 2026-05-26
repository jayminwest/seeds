import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ResponseStartedEvent = {
    type: "conversation.response.started";
    createdAt?: Date | undefined;
    conversationId: string;
};
/** @internal */
export declare const ResponseStartedEvent$inboundSchema: z.ZodType<ResponseStartedEvent, unknown>;
export declare function responseStartedEventFromJSON(jsonString: string): SafeParseResult<ResponseStartedEvent, SDKValidationError>;
//# sourceMappingURL=responsestartedevent.d.ts.map