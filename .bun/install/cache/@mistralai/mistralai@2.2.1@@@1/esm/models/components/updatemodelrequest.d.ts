import * as z from "zod/v4";
export type UpdateModelRequest = {
    name?: string | null | undefined;
    description?: string | null | undefined;
};
/** @internal */
export type UpdateModelRequest$Outbound = {
    name?: string | null | undefined;
    description?: string | null | undefined;
};
/** @internal */
export declare const UpdateModelRequest$outboundSchema: z.ZodType<UpdateModelRequest$Outbound, UpdateModelRequest>;
export declare function updateModelRequestToJSON(updateModelRequest: UpdateModelRequest): string;
//# sourceMappingURL=updatemodelrequest.d.ts.map