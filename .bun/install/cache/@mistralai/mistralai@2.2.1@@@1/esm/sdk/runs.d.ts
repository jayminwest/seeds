import { ClientSDK, RequestOptions } from "../lib/sdks.js";
import * as components from "../models/components/index.js";
import * as operations from "../models/operations/index.js";
import { PageIterator } from "../types/operations.js";
export declare class Runs extends ClientSDK {
    /**
     * List Runs
     */
    listRuns(request?: operations.ListRunsV1WorkflowsRunsGetRequest | undefined, options?: RequestOptions): Promise<PageIterator<operations.ListRunsV1WorkflowsRunsGetResponse, {
        cursor: string;
    }>>;
    /**
     * Get Run
     */
    getRun(request: operations.GetRunV1WorkflowsRunsRunIdGetRequest, options?: RequestOptions): Promise<components.WorkflowExecutionResponse>;
    /**
     * Get Run History
     */
    getRunHistory(request: operations.GetRunHistoryV1WorkflowsRunsRunIdHistoryGetRequest, options?: RequestOptions): Promise<any>;
}
//# sourceMappingURL=runs.d.ts.map