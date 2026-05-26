import * as z from "zod/v4";
export type CreateGithubRepositoryRequest = {
    type: "github";
    name: string;
    owner: string;
    ref?: string | null | undefined;
    weight?: number | undefined;
    token: string;
};
/** @internal */
export type CreateGithubRepositoryRequest$Outbound = {
    type: "github";
    name: string;
    owner: string;
    ref?: string | null | undefined;
    weight: number;
    token: string;
};
/** @internal */
export declare const CreateGithubRepositoryRequest$outboundSchema: z.ZodType<CreateGithubRepositoryRequest$Outbound, CreateGithubRepositoryRequest>;
export declare function createGithubRepositoryRequestToJSON(createGithubRepositoryRequest: CreateGithubRepositoryRequest): string;
//# sourceMappingURL=creategithubrepositoryrequest.d.ts.map