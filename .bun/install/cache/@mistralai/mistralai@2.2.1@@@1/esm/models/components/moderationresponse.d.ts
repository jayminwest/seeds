import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ModerationObject } from "./moderationobject.js";
export type ModerationResponse = {
    id: string;
    model: string;
    results: Array<ModerationObject>;
};
/** @internal */
export declare const ModerationResponse$inboundSchema: z.ZodType<ModerationResponse, unknown>;
export declare function moderationResponseFromJSON(jsonString: string): SafeParseResult<ModerationResponse, SDKValidationError>;
//# sourceMappingURL=moderationresponse.d.ts.map