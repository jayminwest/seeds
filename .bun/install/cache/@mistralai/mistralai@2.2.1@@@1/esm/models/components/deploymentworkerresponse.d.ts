import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type DeploymentWorkerResponse = {
    /**
     * Worker name
     */
    name: string;
    /**
     * When the worker first registered
     */
    createdAt: Date;
    /**
     * When the worker last registered
     */
    updatedAt: Date;
    /**
     * Whether this worker's liveness key is currently alive
     */
    isActive: boolean;
};
/** @internal */
export declare const DeploymentWorkerResponse$inboundSchema: z.ZodType<DeploymentWorkerResponse, unknown>;
export declare function deploymentWorkerResponseFromJSON(jsonString: string): SafeParseResult<DeploymentWorkerResponse, SDKValidationError>;
//# sourceMappingURL=deploymentworkerresponse.d.ts.map