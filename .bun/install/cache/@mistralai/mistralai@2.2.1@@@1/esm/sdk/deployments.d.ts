import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
export declare class Deployments extends ClientSDK {
    /**
     * List Deployments
     */
    listDeployments(request?: operations.ListDeploymentsV1WorkflowsDeploymentsGetRequest | undefined, options?: RequestOptions): Promise<components.DeploymentListResponse>;
    /**
     * Get Deployment
     */
    getDeployment(request: operations.GetDeploymentV1WorkflowsDeploymentsNameGetRequest, options?: RequestOptions): Promise<components.DeploymentDetailResponse>;
}
//# sourceMappingURL=deployments.d.ts.map