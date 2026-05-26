import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const OwnerType: {
    readonly User: "User";
    readonly Workspace: "Workspace";
};
export type OwnerType = ClosedEnum<typeof OwnerType>;
export type CreateLibraryRequest = {
    name: string;
    description?: string | null | undefined;
    chunkSize?: number | null | undefined;
    /**
     * Determines who owns the created library. 'User' creates a private library accessible only to its owner. 'Workspace' creates a library shared with the workspace. Defaults to 'Workspace' for API key sessions. Only API keys with the 'Private and shared connectors' connector access scope can create private, user-owned libraries.
     */
    ownerType?: OwnerType | null | undefined;
};
/** @internal */
export declare const OwnerType$outboundSchema: z.ZodEnum<typeof OwnerType>;
/** @internal */
export type CreateLibraryRequest$Outbound = {
    name: string;
    description?: string | null | undefined;
    chunk_size?: number | null | undefined;
    owner_type?: string | null | undefined;
};
/** @internal */
export declare const CreateLibraryRequest$outboundSchema: z.ZodType<CreateLibraryRequest$Outbound, CreateLibraryRequest>;
export declare function createLibraryRequestToJSON(createLibraryRequest: CreateLibraryRequest): string;
//# sourceMappingURL=createlibraryrequest.d.ts.map