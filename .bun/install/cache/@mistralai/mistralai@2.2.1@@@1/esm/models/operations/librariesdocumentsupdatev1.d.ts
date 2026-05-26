import * as z from "zod/v4";
import * as components from "../components/index.js";
export type LibrariesDocumentsUpdateV1Request = {
    libraryId: string;
    documentId: string;
    updateDocumentRequest: components.UpdateDocumentRequest;
};
/** @internal */
export type LibrariesDocumentsUpdateV1Request$Outbound = {
    library_id: string;
    document_id: string;
    UpdateDocumentRequest: components.UpdateDocumentRequest$Outbound;
};
/** @internal */
export declare const LibrariesDocumentsUpdateV1Request$outboundSchema: z.ZodType<LibrariesDocumentsUpdateV1Request$Outbound, LibrariesDocumentsUpdateV1Request>;
export declare function librariesDocumentsUpdateV1RequestToJSON(librariesDocumentsUpdateV1Request: LibrariesDocumentsUpdateV1Request): string;
//# sourceMappingURL=librariesdocumentsupdatev1.d.ts.map