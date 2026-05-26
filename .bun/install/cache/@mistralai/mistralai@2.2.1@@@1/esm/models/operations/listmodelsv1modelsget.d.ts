import * as z from "zod/v4";
export type ListModelsV1ModelsGetRequest = {
    provider?: string | null | undefined;
    model?: string | null | undefined;
};
/** @internal */
export type ListModelsV1ModelsGetRequest$Outbound = {
    provider?: string | null | undefined;
    model?: string | null | undefined;
};
/** @internal */
export declare const ListModelsV1ModelsGetRequest$outboundSchema: z.ZodType<ListModelsV1ModelsGetRequest$Outbound, ListModelsV1ModelsGetRequest>;
export declare function listModelsV1ModelsGetRequestToJSON(listModelsV1ModelsGetRequest: ListModelsV1ModelsGetRequest): string;
//# sourceMappingURL=listmodelsv1modelsget.d.ts.map