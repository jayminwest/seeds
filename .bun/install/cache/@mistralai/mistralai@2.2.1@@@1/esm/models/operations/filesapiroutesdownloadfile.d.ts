import * as z from "zod/v4";
export type FilesApiRoutesDownloadFileRequest = {
    fileId: string;
};
/** @internal */
export type FilesApiRoutesDownloadFileRequest$Outbound = {
    file_id: string;
};
/** @internal */
export declare const FilesApiRoutesDownloadFileRequest$outboundSchema: z.ZodType<FilesApiRoutesDownloadFileRequest$Outbound, FilesApiRoutesDownloadFileRequest>;
export declare function filesApiRoutesDownloadFileRequestToJSON(filesApiRoutesDownloadFileRequest: FilesApiRoutesDownloadFileRequest): string;
//# sourceMappingURL=filesapiroutesdownloadfile.d.ts.map