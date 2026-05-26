import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type GithubRepository = {
    type: "github";
    name: string;
    owner: string;
    ref?: string | null | undefined;
    weight: number;
    commitId: string;
};
/** @internal */
export declare const GithubRepository$inboundSchema: z.ZodType<GithubRepository, unknown>;
export declare function githubRepositoryFromJSON(jsonString: string): SafeParseResult<GithubRepository, SDKValidationError>;
//# sourceMappingURL=githubrepository.d.ts.map