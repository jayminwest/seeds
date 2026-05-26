import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type WandbIntegrationResult = {
    type: "wandb";
    /**
     * The name of the project that the new run will be created under.
     */
    project: string;
    /**
     * A display name to set for the run. If not set, will use the job ID as the name.
     */
    name?: string | null | undefined;
    runName?: string | null | undefined;
    url?: string | null | undefined;
};
/** @internal */
export declare const WandbIntegrationResult$inboundSchema: z.ZodType<WandbIntegrationResult, unknown>;
export declare function wandbIntegrationResultFromJSON(jsonString: string): SafeParseResult<WandbIntegrationResult, SDKValidationError>;
//# sourceMappingURL=wandbintegrationresult.d.ts.map