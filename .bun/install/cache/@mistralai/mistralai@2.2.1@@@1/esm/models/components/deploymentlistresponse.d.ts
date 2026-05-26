import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DeploymentResponse } from "./deploymentresponse.js";
export type DeploymentListResponse = {
    /**
     * List of deployments
     */
    deployments: Array<DeploymentResponse>;
};
/** @internal */
export declare const DeploymentListResponse$inboundSchema: z.ZodType<DeploymentListResponse, unknown>;
export declare function deploymentListResponseFromJSON(jsonString: string): SafeParseResult<DeploymentListResponse, SDKValidationError>;
//# sourceMappingURL=deploymentlistresponse.d.ts.map