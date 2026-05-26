import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type Sharing = {
    libraryId: string;
    userId?: string | null | undefined;
    orgId: string;
    role: string;
    shareWithType: string;
    shareWithUuid: string | null;
};
/** @internal */
export declare const Sharing$inboundSchema: z.ZodType<Sharing, unknown>;
export declare function sharingFromJSON(jsonString: string): SafeParseResult<Sharing, SDKValidationError>;
//# sourceMappingURL=sharing.d.ts.map