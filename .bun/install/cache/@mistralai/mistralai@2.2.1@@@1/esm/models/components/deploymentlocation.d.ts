import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { LocationType } from "./locationtype.js";
export type DeploymentLocation = {
    locationType: LocationType;
    /**
     * K8s cluster name, if applicable
     */
    k8sCluster?: string | null | undefined;
    /**
     * K8s namespace, if applicable
     */
    k8sNamespace?: string | null | undefined;
};
/** @internal */
export declare const DeploymentLocation$inboundSchema: z.ZodType<DeploymentLocation, unknown>;
export declare function deploymentLocationFromJSON(jsonString: string): SafeParseResult<DeploymentLocation, SDKValidationError>;
//# sourceMappingURL=deploymentlocation.d.ts.map