import * as z from "zod/v4";
export type UpdateDatasetRequest = {
    name?: string | null | undefined;
    description?: string | null | undefined;
};
/** @internal */
export type UpdateDatasetRequest$Outbound = {
    name?: string | null | undefined;
    description?: string | null | undefined;
};
/** @internal */
export declare const UpdateDatasetRequest$outboundSchema: z.ZodType<UpdateDatasetRequest$Outbound, UpdateDatasetRequest>;
export declare function updateDatasetRequestToJSON(updateDatasetRequest: UpdateDatasetRequest): string;
//# sourceMappingURL=updatedatasetrequest.d.ts.map