import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type Library = {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string | null;
    ownerType: string;
    totalSize: number;
    nbDocuments: number;
    chunkSize: number | null;
    emoji?: string | null | undefined;
    description?: string | null | undefined;
    generatedDescription?: string | null | undefined;
    explicitUserMembersCount?: number | null | undefined;
    explicitWorkspaceMembersCount?: number | null | undefined;
    /**
     * @deprecated field: This will be removed in a future release, please migrate away from it as soon as possible.
     */
    orgSharingRole?: string | null | undefined;
    /**
     * Generated Name
     */
    generatedName?: string | null | undefined;
};
/** @internal */
export declare const Library$inboundSchema: z.ZodType<Library, unknown>;
export declare function libraryFromJSON(jsonString: string): SafeParseResult<Library, SDKValidationError>;
//# sourceMappingURL=library.d.ts.map