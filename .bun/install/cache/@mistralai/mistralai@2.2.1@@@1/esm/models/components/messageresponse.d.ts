import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type MessageResponse = {
    message: string;
};
/** @internal */
export declare const MessageResponse$inboundSchema: z.ZodType<MessageResponse, unknown>;
export declare function messageResponseFromJSON(jsonString: string): SafeParseResult<MessageResponse, SDKValidationError>;
//# sourceMappingURL=messageresponse.d.ts.map