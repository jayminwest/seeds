import * as z from "zod/v4";
export type CreateDatasetRequest = {
    name: string;
    description: string;
};
/** @internal */
export type CreateDatasetRequest$Outbound = {
    name: string;
    description: string;
};
/** @internal */
export declare const CreateDatasetRequest$outboundSchema: z.ZodType<CreateDatasetRequest$Outbound, CreateDatasetRequest>;
export declare function createDatasetRequestToJSON(createDatasetRequest: CreateDatasetRequest): string;
//# sourceMappingURL=createdatasetrequest.d.ts.map