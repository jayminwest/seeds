import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
/**
 * Additional properties describing a Tool to clients.
 *
 * @remarks
 *
 * NOTE: all properties in ToolAnnotations are **hints**.
 * They are not guaranteed to provide a faithful description of
 * tool behavior (including descriptive properties like `title`).
 *
 * Clients should never make tool use decisions based on ToolAnnotations
 * received from untrusted servers.
 */
export type ToolAnnotations = {
    title?: string | null | undefined;
    readOnlyHint?: boolean | null | undefined;
    destructiveHint?: boolean | null | undefined;
    idempotentHint?: boolean | null | undefined;
    openWorldHint?: boolean | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const ToolAnnotations$inboundSchema: z.ZodType<ToolAnnotations, unknown>;
export declare function toolAnnotationsFromJSON(jsonString: string): SafeParseResult<ToolAnnotations, SDKValidationError>;
//# sourceMappingURL=toolannotations.d.ts.map