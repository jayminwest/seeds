import * as z from "zod/v4";
export type ImportDatasetFromPlaygroundRequest = {
    conversationIds: Array<string>;
};
/** @internal */
export type ImportDatasetFromPlaygroundRequest$Outbound = {
    conversation_ids: Array<string>;
};
/** @internal */
export declare const ImportDatasetFromPlaygroundRequest$outboundSchema: z.ZodType<ImportDatasetFromPlaygroundRequest$Outbound, ImportDatasetFromPlaygroundRequest>;
export declare function importDatasetFromPlaygroundRequestToJSON(importDatasetFromPlaygroundRequest: ImportDatasetFromPlaygroundRequest): string;
//# sourceMappingURL=importdatasetfromplaygroundrequest.d.ts.map