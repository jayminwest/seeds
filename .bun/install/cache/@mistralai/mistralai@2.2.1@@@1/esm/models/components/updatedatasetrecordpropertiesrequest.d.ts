import * as z from "zod/v4";
export type UpdateDatasetRecordPropertiesRequest = {
    properties: {
        [k: string]: any;
    };
};
/** @internal */
export type UpdateDatasetRecordPropertiesRequest$Outbound = {
    properties: {
        [k: string]: any;
    };
};
/** @internal */
export declare const UpdateDatasetRecordPropertiesRequest$outboundSchema: z.ZodType<UpdateDatasetRecordPropertiesRequest$Outbound, UpdateDatasetRecordPropertiesRequest>;
export declare function updateDatasetRecordPropertiesRequestToJSON(updateDatasetRecordPropertiesRequest: UpdateDatasetRecordPropertiesRequest): string;
//# sourceMappingURL=updatedatasetrecordpropertiesrequest.d.ts.map