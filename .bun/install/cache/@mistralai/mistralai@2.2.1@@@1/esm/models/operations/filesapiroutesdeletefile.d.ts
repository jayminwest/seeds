import * as z from "zod/v4";
export type FilesApiRoutesDeleteFileRequest = {
    fileId: string;
};
/** @internal */
export type FilesApiRoutesDeleteFileRequest$Outbound = {
    file_id: string;
};
/** @internal */
export declare const FilesApiRoutesDeleteFileRequest$outboundSchema: z.ZodType<FilesApiRoutesDeleteFileRequest$Outbound, FilesApiRoutesDeleteFileRequest>;
export declare function filesApiRoutesDeleteFileRequestToJSON(filesApiRoutesDeleteFileRequest: FilesApiRoutesDeleteFileRequest): string;
//# sourceMappingURL=filesapiroutesdeletefile.d.ts.map