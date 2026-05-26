import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { AudioChunk, AudioChunk$Outbound } from "./audiochunk.js";
import { DocumentURLChunk, DocumentURLChunk$Outbound } from "./documenturlchunk.js";
import { FileChunk, FileChunk$Outbound } from "./filechunk.js";
import { ImageURLChunk, ImageURLChunk$Outbound } from "./imageurlchunk.js";
import { ReferenceChunk, ReferenceChunk$Outbound } from "./referencechunk.js";
import { TextChunk, TextChunk$Outbound } from "./textchunk.js";
import { ThinkChunk, ThinkChunk$Outbound } from "./thinkchunk.js";
export type ContentChunk = (ImageURLChunk & {
    type: "image_url";
}) | (DocumentURLChunk & {
    type: "document_url";
}) | (TextChunk & {
    type: "text";
}) | (ReferenceChunk & {
    type: "reference";
}) | (FileChunk & {
    type: "file";
}) | (ThinkChunk & {
    type: "thinking";
}) | AudioChunk | discriminatedUnionTypes.Unknown<"type">;
/** @internal */
export declare const ContentChunk$inboundSchema: z.ZodType<ContentChunk, unknown>;
/** @internal */
export type ContentChunk$Outbound = (ImageURLChunk$Outbound & {
    type: "image_url";
}) | (DocumentURLChunk$Outbound & {
    type: "document_url";
}) | (TextChunk$Outbound & {
    type: "text";
}) | (ReferenceChunk$Outbound & {
    type: "reference";
}) | (FileChunk$Outbound & {
    type: "file";
}) | (ThinkChunk$Outbound & {
    type: "thinking";
}) | AudioChunk$Outbound;
/** @internal */
export declare const ContentChunk$outboundSchema: z.ZodType<ContentChunk$Outbound, ContentChunk>;
export declare function contentChunkToJSON(contentChunk: ContentChunk): string;
export declare function contentChunkFromJSON(jsonString: string): SafeParseResult<ContentChunk, SDKValidationError>;
//# sourceMappingURL=contentchunk.d.ts.map