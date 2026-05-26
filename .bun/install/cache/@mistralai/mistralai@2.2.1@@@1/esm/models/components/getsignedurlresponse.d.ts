import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type GetSignedUrlResponse = {
    url: string;
};
/** @internal */
export declare const GetSignedUrlResponse$inboundSchema: z.ZodType<GetSignedUrlResponse, unknown>;
export declare function getSignedUrlResponseFromJSON(jsonString: string): SafeParseResult<GetSignedUrlResponse, SDKValidationError>;
//# sourceMappingURL=getsignedurlresponse.d.ts.map