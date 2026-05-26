import * as z from "zod/v4";
export type ImportDatasetFromExplorerRequest = {
    completionEventIds: Array<string>;
};
/** @internal */
export type ImportDatasetFromExplorerRequest$Outbound = {
    completion_event_ids: Array<string>;
};
/** @internal */
export declare const ImportDatasetFromExplorerRequest$outboundSchema: z.ZodType<ImportDatasetFromExplorerRequest$Outbound, ImportDatasetFromExplorerRequest>;
export declare function importDatasetFromExplorerRequestToJSON(importDatasetFromExplorerRequest: ImportDatasetFromExplorerRequest): string;
//# sourceMappingURL=importdatasetfromexplorerrequest.d.ts.map