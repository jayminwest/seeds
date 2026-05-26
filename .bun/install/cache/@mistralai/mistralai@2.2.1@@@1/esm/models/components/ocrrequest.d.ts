import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
import { DocumentURLChunk, DocumentURLChunk$Outbound } from "./documenturlchunk.js";
import { FileChunk, FileChunk$Outbound } from "./filechunk.js";
import { ImageURLChunk, ImageURLChunk$Outbound } from "./imageurlchunk.js";
import { ResponseFormat, ResponseFormat$Outbound } from "./responseformat.js";
/**
 * Document to run OCR on
 */
export type DocumentUnion = FileChunk | DocumentURLChunk | ImageURLChunk;
/**
 * Specific pages to process. Accepts a list of integers or a string of comma-separated numbers and ranges (e.g. '0,1,2' or '0-5' or '0,2-4'). Page numbers start from 0.
 */
export type Pages = string | Array<number>;
export declare const TableFormat: {
    readonly Markdown: "markdown";
    readonly Html: "html";
};
export type TableFormat = ClosedEnum<typeof TableFormat>;
export declare const ConfidenceScoresGranularity: {
    readonly Word: "word";
    readonly Page: "page";
};
export type ConfidenceScoresGranularity = ClosedEnum<typeof ConfidenceScoresGranularity>;
export type OCRRequest = {
    model: string | null;
    id?: string | undefined;
    /**
     * Document to run OCR on
     */
    document: FileChunk | DocumentURLChunk | ImageURLChunk;
    /**
     * Specific pages to process. Accepts a list of integers or a string of comma-separated numbers and ranges (e.g. '0,1,2' or '0-5' or '0,2-4'). Page numbers start from 0.
     */
    pages?: string | Array<number> | null | undefined;
    /**
     * Include image URLs in response
     */
    includeImageBase64?: boolean | null | undefined;
    /**
     * Max images to extract
     */
    imageLimit?: number | null | undefined;
    /**
     * Minimum height and width of image to extract
     */
    imageMinSize?: number | null | undefined;
    /**
     * Structured output class for extracting useful information from each extracted bounding box / image from document. Only json_schema is valid for this field
     */
    bboxAnnotationFormat?: ResponseFormat | null | undefined;
    /**
     * Structured output class for extracting useful information from the entire document. Only json_schema is valid for this field
     */
    documentAnnotationFormat?: ResponseFormat | null | undefined;
    /**
     * Optional prompt to guide the model in extracting structured output from the entire document. A document_annotation_format must be provided.
     */
    documentAnnotationPrompt?: string | null | undefined;
    tableFormat?: TableFormat | null | undefined;
    extractHeader?: boolean | undefined;
    extractFooter?: boolean | undefined;
    /**
     * Granularity for confidence scores: 'word' (per-word scores) or 'page' (aggregate only). Defaults to None (no confidence scores) to keep response payload small.
     */
    confidenceScoresGranularity?: ConfidenceScoresGranularity | null | undefined;
};
/** @internal */
export type DocumentUnion$Outbound = FileChunk$Outbound | DocumentURLChunk$Outbound | ImageURLChunk$Outbound;
/** @internal */
export declare const DocumentUnion$outboundSchema: z.ZodType<DocumentUnion$Outbound, DocumentUnion>;
export declare function documentUnionToJSON(documentUnion: DocumentUnion): string;
/** @internal */
export type Pages$Outbound = string | Array<number>;
/** @internal */
export declare const Pages$outboundSchema: z.ZodType<Pages$Outbound, Pages>;
export declare function pagesToJSON(pages: Pages): string;
/** @internal */
export declare const TableFormat$outboundSchema: z.ZodEnum<typeof TableFormat>;
/** @internal */
export declare const ConfidenceScoresGranularity$outboundSchema: z.ZodEnum<typeof ConfidenceScoresGranularity>;
/** @internal */
export type OCRRequest$Outbound = {
    model: string | null;
    id?: string | undefined;
    document: FileChunk$Outbound | DocumentURLChunk$Outbound | ImageURLChunk$Outbound;
    pages?: string | Array<number> | null | undefined;
    include_image_base64?: boolean | null | undefined;
    image_limit?: number | null | undefined;
    image_min_size?: number | null | undefined;
    bbox_annotation_format?: ResponseFormat$Outbound | null | undefined;
    document_annotation_format?: ResponseFormat$Outbound | null | undefined;
    document_annotation_prompt?: string | null | undefined;
    table_format?: string | null | undefined;
    extract_header?: boolean | undefined;
    extract_footer?: boolean | undefined;
    confidence_scores_granularity?: string | null | undefined;
};
/** @internal */
export declare const OCRRequest$outboundSchema: z.ZodType<OCRRequest$Outbound, OCRRequest>;
export declare function ocrRequestToJSON(ocrRequest: OCRRequest): string;
//# sourceMappingURL=ocrrequest.d.ts.map