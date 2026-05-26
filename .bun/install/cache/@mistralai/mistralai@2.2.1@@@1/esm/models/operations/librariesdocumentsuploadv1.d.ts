import * as z from "zod/v4";
import * as components from "../components/index.js";
export type DocumentUpload = {
    /**
     * The File object (not file name) to be uploaded.
     *
     * @remarks
     *  To upload a file and specify a custom file name you should format your request as such:
     *  ```bash
     *  file=@path/to/your/file.jsonl;filename=custom_name.jsonl
     *  ```
     *  Otherwise, you can just keep the original file name:
     *  ```bash
     *  file=@path/to/your/file.jsonl
     *  ```
     */
    file: components.FileT | Blob;
};
export type LibrariesDocumentsUploadV1Request = {
    libraryId: string;
    requestBody: DocumentUpload;
};
/** @internal */
export type DocumentUpload$Outbound = {
    file: components.FileT$Outbound | Blob;
};
/** @internal */
export declare const DocumentUpload$outboundSchema: z.ZodType<DocumentUpload$Outbound, DocumentUpload>;
export declare function documentUploadToJSON(documentUpload: DocumentUpload): string;
/** @internal */
export type LibrariesDocumentsUploadV1Request$Outbound = {
    library_id: string;
    RequestBody: DocumentUpload$Outbound;
};
/** @internal */
export declare const LibrariesDocumentsUploadV1Request$outboundSchema: z.ZodType<LibrariesDocumentsUploadV1Request$Outbound, LibrariesDocumentsUploadV1Request>;
export declare function librariesDocumentsUploadV1RequestToJSON(librariesDocumentsUploadV1Request: LibrariesDocumentsUploadV1Request): string;
//# sourceMappingURL=librariesdocumentsuploadv1.d.ts.map