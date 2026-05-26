import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Sharing } from "./sharing.js";
export type ListSharingResponse = {
    data: Array<Sharing>;
};
/** @internal */
export declare const ListSharingResponse$inboundSchema: z.ZodType<ListSharingResponse, unknown>;
export declare function listSharingResponseFromJSON(jsonString: string): SafeParseResult<ListSharingResponse, SDKValidationError>;
//# sourceMappingURL=listsharingresponse.d.ts.map