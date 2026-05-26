import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DeploymentLocation } from "./deploymentlocation.js";
export type DeploymentResponse = {
    /**
     * Unique identifier of the deployment
     */
    id: string;
    /**
     * Deployment name
     */
    name: string;
    /**
     * Whether at least one worker is currently live
     */
    isActive: boolean;
    /**
     * When the deployment was first registered
     */
    createdAt: Date;
    /**
     * When the deployment was last updated
     */
    updatedAt: Date;
    /**
     * Where the deployment is running
     */
    location?: DeploymentLocation | null | undefined;
};
/** @internal */
export declare const DeploymentResponse$inboundSchema: z.ZodType<DeploymentResponse, unknown>;
export declare function deploymentResponseFromJSON(jsonString: string): SafeParseResult<DeploymentResponse, SDKValidationError>;
//# sourceMappingURL=deploymentresponse.d.ts.map