import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Binary contents of a resource.
 */
export type BlobResourceContents = {
    uri: string;
    mimeType?: string | null | undefined;
    meta?: {
        [k: string]: any;
    } | null | undefined;
    blob: string;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const BlobResourceContents$inboundSchema: z.ZodType<BlobResourceContents, unknown>;
export declare function blobResourceContentsFromJSON(jsonString: string): SafeParseResult<BlobResourceContents, SDKValidationError>;
//# sourceMappingURL=blobresourcecontents.d.ts.map