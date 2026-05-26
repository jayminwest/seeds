import * as z from "zod/v4";
import * as components from "../components/index.js";
export type LibrariesShareCreateV1Request = {
    libraryId: string;
    sharingRequest: components.SharingRequest;
};
/** @internal */
export type LibrariesShareCreateV1Request$Outbound = {
    library_id: string;
    SharingRequest: components.SharingRequest$Outbound;
};
/** @internal */
export declare const LibrariesShareCreateV1Request$outboundSchema: z.ZodType<LibrariesShareCreateV1Request$Outbound, LibrariesShareCreateV1Request>;
export declare function librariesShareCreateV1RequestToJSON(librariesShareCreateV1Request: LibrariesShareCreateV1Request): string;
//# sourceMappingURL=librariessharecreatev1.d.ts.map