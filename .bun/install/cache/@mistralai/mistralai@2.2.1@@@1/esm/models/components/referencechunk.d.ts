import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ReferenceId = string | number;
export type ReferenceChunk = {
    type?: "reference" | undefined;
    referenceIds: Array<string | number>;
};
/** @internal */
export declare const ReferenceId$inboundSchema: z.ZodType<ReferenceId, unknown>;
/** @internal */
export type ReferenceId$Outbound = string | number;
/** @internal */
export declare const ReferenceId$outboundSchema: z.ZodType<ReferenceId$Outbound, ReferenceId>;
export declare function referenceIdToJSON(referenceId: ReferenceId): string;
export declare function referenceIdFromJSON(jsonString: string): SafeParseResult<ReferenceId, SDKValidationError>;
/** @internal */
export declare const ReferenceChunk$inboundSchema: z.ZodType<ReferenceChunk, unknown>;
/** @internal */
export type ReferenceChunk$Outbound = {
    type: "reference";
    reference_ids: Array<string | number>;
};
/** @internal */
export declare const ReferenceChunk$outboundSchema: z.ZodType<ReferenceChunk$Outbound, ReferenceChunk>;
export declare function referenceChunkToJSON(referenceChunk: ReferenceChunk): string;
export declare function referenceChunkFromJSON(jsonString: string): SafeParseResult<ReferenceChunk, SDKValidationError>;
//# sourceMappingURL=referencechunk.d.ts.map