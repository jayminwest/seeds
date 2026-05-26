import * as z from "zod/v4";
export type ImportDatasetFromFileRequest = {
    fileId: string;
};
/** @internal */
export type ImportDatasetFromFileRequest$Outbound = {
    file_id: string;
};
/** @internal */
export declare const ImportDatasetFromFileRequest$outboundSchema: z.ZodType<ImportDatasetFromFileRequest$Outbound, ImportDatasetFromFileRequest>;
export declare function importDatasetFromFileRequestToJSON(importDatasetFromFileRequest: ImportDatasetFromFileRequest): string;
//# sourceMappingURL=importdatasetfromfilerequest.d.ts.map