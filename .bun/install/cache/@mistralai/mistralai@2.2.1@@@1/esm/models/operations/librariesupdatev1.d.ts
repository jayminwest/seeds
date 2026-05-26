import * as z from "zod/v4";
import * as components from "../components/index.js";
export type LibrariesUpdateV1Request = {
    libraryId: string;
    updateLibraryRequest: components.UpdateLibraryRequest;
};
/** @internal */
export type LibrariesUpdateV1Request$Outbound = {
    library_id: string;
    UpdateLibraryRequest: components.UpdateLibraryRequest$Outbound;
};
/** @internal */
export declare const LibrariesUpdateV1Request$outboundSchema: z.ZodType<LibrariesUpdateV1Request$Outbound, LibrariesUpdateV1Request>;
export declare function librariesUpdateV1RequestToJSON(librariesUpdateV1Request: LibrariesUpdateV1Request): string;
//# sourceMappingURL=librariesupdatev1.d.ts.map