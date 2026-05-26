import * as z from "zod/v4";
export type LibrariesDocumentsGetTextContentV1Request = {
    libraryId: string;
    documentId: string;
    pageStart?: number | null | undefined;
    pageEnd?: number | null | undefined;
};
/** @internal */
export type LibrariesDocumentsGetTextContentV1Request$Outbound = {
    library_id: string;
    document_id: string;
    page_start?: number | null | undefined;
    page_end?: number | null | undefined;
};
/** @internal */
export declare const LibrariesDocumentsGetTextContentV1Request$outboundSchema: z.ZodType<LibrariesDocumentsGetTextContentV1Request$Outbound, LibrariesDocumentsGetTextContentV1Request>;
export declare function librariesDocumentsGetTextContentV1RequestToJSON(librariesDocumentsGetTextContentV1Request: LibrariesDocumentsGetTextContentV1Request): string;
//# sourceMappingURL=librariesdocumentsgettextcontentv1.d.ts.map