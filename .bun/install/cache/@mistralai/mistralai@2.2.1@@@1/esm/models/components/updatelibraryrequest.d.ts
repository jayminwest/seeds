import * as z from "zod/v4";
export type UpdateLibraryRequest = {
    name?: string | null | undefined;
    description?: string | null | undefined;
};
/** @internal */
export type UpdateLibraryRequest$Outbound = {
    name?: string | null | undefined;
    description?: string | null | undefined;
};
/** @internal */
export declare const UpdateLibraryRequest$outboundSchema: z.ZodType<UpdateLibraryRequest$Outbound, UpdateLibraryRequest>;
export declare function updateLibraryRequestToJSON(updateLibraryRequest: UpdateLibraryRequest): string;
//# sourceMappingURL=updatelibraryrequest.d.ts.map