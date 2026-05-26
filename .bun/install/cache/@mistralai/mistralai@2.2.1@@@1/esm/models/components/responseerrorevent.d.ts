import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ResponseErrorEvent = {
    type: "conversation.response.error";
    createdAt?: Date | undefined;
    message: string;
    code: number;
};
/** @internal */
export declare const ResponseErrorEvent$inboundSchema: z.ZodType<ResponseErrorEvent, unknown>;
export declare function responseErrorEventFromJSON(jsonString: string): SafeParseResult<ResponseErrorEvent, SDKValidationError>;
//# sourceMappingURL=responseerrorevent.d.ts.map