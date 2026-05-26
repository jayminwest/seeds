import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DeploymentLocation } from "./deploymentlocation.js";
import { DeploymentWorkerResponse } from "./deploymentworkerresponse.js";
export type DeploymentDetailResponse = {
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
    /**
     * Workers registered for the deployment
     */
    workers: Array<DeploymentWorkerResponse>;
};
/** @internal */
export declare const DeploymentDetailResponse$inboundSchema: z.ZodType<DeploymentDetailResponse, unknown>;
export declare function deploymentDetailResponseFromJSON(jsonString: string): SafeParseResult<DeploymentDetailResponse, SDKValidationError>;
//# sourceMappingURL=deploymentdetailresponse.d.ts.map