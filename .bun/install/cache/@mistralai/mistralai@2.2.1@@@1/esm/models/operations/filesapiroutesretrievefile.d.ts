import * as z from "zod/v4";
export type FilesApiRoutesRetrieveFileRequest = {
    fileId: string;
};
/** @internal */
export type FilesApiRoutesRetrieveFileRequest$Outbound = {
    file_id: string;
};
/** @internal */
export declare const FilesApiRoutesRetrieveFileRequest$outboundSchema: z.ZodType<FilesApiRoutesRetrieveFileRequest$Outbound, FilesApiRoutesRetrieveFileRequest>;
export declare function filesApiRoutesRetrieveFileRequestToJSON(filesApiRoutesRetrieveFileRequest: FilesApiRoutesRetrieveFileRequest): string;
//# sourceMappingURL=filesapiroutesretrievefile.d.ts.map