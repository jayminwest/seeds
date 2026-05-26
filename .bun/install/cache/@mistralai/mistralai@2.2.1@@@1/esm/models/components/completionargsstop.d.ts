import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type CompletionArgsStop = string | Array<string>;
/** @internal */
export declare const CompletionArgsStop$inboundSchema: z.ZodType<CompletionArgsStop, unknown>;
/** @internal */
export type CompletionArgsStop$Outbound = string | Array<string>;
/** @internal */
export declare const CompletionArgsStop$outboundSchema: z.ZodType<CompletionArgsStop$Outbound, CompletionArgsStop>;
export declare function completionArgsStopToJSON(completionArgsStop: CompletionArgsStop): string;
export declare function completionArgsStopFromJSON(jsonString: string): SafeParseResult<CompletionArgsStop, SDKValidationError>;
//# sourceMappingURL=completionargsstop.d.ts.map