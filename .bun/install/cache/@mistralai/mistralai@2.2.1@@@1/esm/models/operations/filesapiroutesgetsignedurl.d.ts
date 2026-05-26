import * as z from "zod/v4";
export type FilesApiRoutesGetSignedUrlRequest = {
    fileId: string;
    /**
     * Number of hours before the URL becomes invalid. Defaults to 24h. Must be between 1h and 168h.
     */
    expiry?: number | undefined;
};
/** @internal */
export type FilesApiRoutesGetSignedUrlRequest$Outbound = {
    file_id: string;
    expiry: number;
};
/** @internal */
export declare const FilesApiRoutesGetSignedUrlRequest$outboundSchema: z.ZodType<FilesApiRoutesGetSignedUrlRequest$Outbound, FilesApiRoutesGetSignedUrlRequest>;
export declare function filesApiRoutesGetSignedUrlRequestToJSON(filesApiRoutesGetSignedUrlRequest: FilesApiRoutesGetSignedUrlRequest): string;
//# sourceMappingURL=filesapiroutesgetsignedurl.d.ts.map